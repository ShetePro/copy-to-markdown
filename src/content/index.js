import {unified} from "unified";
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

const position = {x: 0, y: 0};
export let popupCopy = null;
export const setting = {};

const storage = await getChromeStorage();
Object.assign(setting, storage);
initEvent();

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
    selectorHandle().catch(console.error);
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
        astHtmlToMarkdown(copyNode)
            .then((res) => {
              // 正则替换 TEX中的\_为_
              const markdownText = unTexMarkdownEscaping(res);
              writeTextClipboard(markdownText || selectedText.toString());
              chrome?.runtime.sendMessage({
                extensionId: chrome?.runtime.id,
                message: markdownText,
              });
              resolve(markdownText);
            })
            .catch((e) => {
              console.log(e);
              reject(e);
            });
      }
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
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

export async function astHtmlToMarkdown(node) {
  // 预处理孤立的 li 元素，将其包装为有序列表
  node = wrapOrphanListItems(node);

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
          // 去除注释节点
          comment(_state, _node, _parent) {
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
