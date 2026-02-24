/* global chrome */
// @ts-check
/// <reference types="chrome"/>

import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import {
  findFirstTextNode,
  hasSelector,
  writeTextClipboard,
  removeListEmptyLines,
  wrapOrphanListItems,
} from "../utils/util.js";
import {PopupCopy} from "./popupCopy.js";
import "./copyStyle.module.css";
import {
  getChromeStorage,
  watchChromeStorage,
} from "../utils/chromeStorage.js";
import {
  unTexMarkdownEscaping,
  fixMathDollarSpacing,
  getParentNodeIsTexNode,
  getRangeTexClone,
  hasTexNode,
  setKatexText,
  fixTexDoubleEscapeInMarkdown,
} from "../utils/tex.js";

const position = { x: 0, y: 0 };
export let popupCopy = null;
/** @type {{selectionPopup?: boolean, nbspConvert?: boolean}} */
export let setting = {};
getChromeStorage().then((res) => {
  setting = res;
  initEvent();
});

watchChromeStorage((changes) => {
  const {newValue, oldValue} = changes;
  Object.assign(setting, newValue);
  if (newValue.selectionPopup !== oldValue.selectionPopup) {
    newValue.selectionPopup ? togglePopup() : popupCopy?.hide();
  }
});
// contentMenu click event
chrome?.runtime.onMessage.addListener((response) => {
  if (response === "transformToMarkdown") {
    selectorHandle().catch((err) => {
      console.error("selectorHandle failed:", err);
    });
  }
});

function initEvent() {
  document.addEventListener("mouseup", bindPopupEvent);
}

export function bindPopupEvent(event) {
  const {target, x, y} = event;
  // 异步获取选中内容
  setTimeout(() => {
    // 关键修复：检查 target 是否在 popup 容器内，防止点击按钮时重新定位
    if (target !== popupCopy?.popup && !popupCopy?.popup?.contains(target)) {
      position.x = x;
      position.y = y;
      if (!setting.selectionPopup) return;
      togglePopup();
    }
  });
}

export function togglePopup() {
  if (hasSelector()) {
    createPopup();
  } else {
    popupCopy?.hide();
  }
}

export function createPopup() {
  if (!popupCopy) {
    popupCopy = new PopupCopy({
      x: position.x,
      y: position.y,
      click: selectorHandle,
    });
  }
  popupCopy?.setPosition(position);
  popupCopy?.show();
}

export function selectorHandle() {
  return new Promise((resolve, reject) => {
    try {
      // 获取选择的内容
      const selectedText = globalThis.getSelection();
      const ranges = [];
      const {rangeCount} = selectedText;
      for (let i = 0; i < rangeCount; ++i) {
        ranges[i] = selectedText.getRangeAt(i);
        const copyNode = transformRange(ranges[i]);
        // 检测原始选区的上下文，判断孤立的 li 应该被包装成 ul 还是 ol
        const listType = detectListTypeFromRange(ranges[i]);
        astHtmlToMarkdown(copyNode, listType).then((res) => {
          // 正则替换 TEX中的\_为_
          const markdownText = unTexMarkdownEscaping(res);
          writeTextClipboard(markdownText || selectedText.toString());
          chrome?.runtime.sendMessage({
            extensionId: chrome?.runtime.id,
            message: markdownText,
          });
        });
      }
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

/**
 * 根据选区范围检测列表类型
 * 如果选区的祖先或选区内包含 <ul>，则返回 'ul'
 * 如果选区的祖先或选区内包含 <ol>，则返回 'ol'
 * 默认返回 'ol'（保持向后兼容）
 *
 * @param {Range} range - 选区范围
 * @returns {'ul'|'ol'} - 检测到的列表类型
 */
function detectListTypeFromRange(range) {
  if (!range) return "ol";

  const { commonAncestorContainer } = range;
  if (!commonAncestorContainer) return "ol";

  // 获取祖先元素（如果是文本节点则获取其父元素）
  let ancestorElement = commonAncestorContainer;
  if (commonAncestorContainer.nodeType === Node.TEXT_NODE) {
    ancestorElement = commonAncestorContainer.parentElement;
  }

  if (!ancestorElement) return "ol";

  // 检查祖先元素是否在 <ul> 或 <ol> 中
  let parent = ancestorElement;
  let hasUl = false;
  let hasOl = false;

  // 向上遍历祖先链
  while (parent && parent !== document.body) {
    if (parent.tagName === "UL") {
      hasUl = true;
      break;
    }
    if (parent.tagName === "OL") {
      hasOl = true;
      break;
    }
    parent = parent.parentElement;
  }

  // 如果在 <ul> 中，返回 'ul'
  if (hasUl) return "ul";
  // 如果在 <ol> 中，返回 'ol'
  if (hasOl) return "ol";

  // 检查选区内容本身是否包含 <ul> 或 <ol>
  const clonedContent = range.cloneContents();
  if (clonedContent.querySelector("ul")) return "ul";
  if (clonedContent.querySelector("ol")) return "ol";

  // 默认返回 'ol' 保持向后兼容
  return "ol";
}

export function transformRange(range) {
  const {commonAncestorContainer} = range;
  if (commonAncestorContainer.nodeType === Node.TEXT_NODE)
    return range.cloneContents();
  const isTexNode = hasTexNode(commonAncestorContainer);
  let dom = isTexNode
      ? getParentNodeIsTexNode(commonAncestorContainer)
      : cloneRangeDom(range);
  dom = setKatexText(dom);
  console.log(dom, "setKatexText");
  // 如果是code节点则设置code 语言
  if (typeof dom.querySelector === "function") {
    dom = setCodeText(dom);
  }
  return dom;
}

// clone range中的选中内容
export function cloneRangeDom(range) {
  // 针对处理tex 样式
  return getRangeTexClone(range);
}

// gemini 代码块语言设置
export function setCodeBlockLanguage(dom) {
  let codes = dom?.querySelectorAll?.("code-block");
  for (const code of codes) {
    const langNode = findFirstTextNode(code);
    let lang = langNode?.textContent
        .toLocaleLowerCase()
        .replaceAll(/['"]/g, "");
    if (langNode) {
      langNode.textContent = "";
    }
    const codeDom = code.querySelector("code");
    if (lang && codeDom) {
      codeDom.classList?.add(`language-${lang}`);
    }
  }
}

// 优化code 代码
export function setCodeText(dom) {
  // 根据pre下的第一个textNode 来判断code 语言
  setCodeBlockLanguage(dom);
  const pres = dom.querySelectorAll("pre");
  for (const pre of pres) {
    const code = pre.querySelector("code");
    if (code) {
      code?.remove();
      let lang = findFirstTextNode(pre)
          ?.textContent.toLocaleLowerCase()
          .replaceAll(/['"]/g, "");
      lang && code?.classList.add(`language-${lang}`);
      pre.innerHTML = "";
      pre.appendChild(code);
    }
  }
  return dom;
}

export async function astHtmlToMarkdown(node, listType = "ol") {
  // 预处理孤立的 li 元素，根据上下文将其包装为相应的列表类型
  node = wrapOrphanListItems(node, listType);

  const container = document.createElement("div");
  container.append(node);
  let html = container.innerHTML;
  if (setting?.nbspConvert) {
    html = html.replaceAll("&nbsp;", " ");
  }
  const html2Markdown = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      nodeHandlers: {
        comment: (state, node, parent) => {
          void state;
          void node;
          void parent;
          return null;
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify)
    .process(html);
  const markdown = fixTexDoubleEscapeInMarkdown(
    fixMathDollarSpacing(html2Markdown.value),
  );
  // 移除列表项之间的空行，使列表更紧凑
  return removeListEmptyLines(markdown);
}
