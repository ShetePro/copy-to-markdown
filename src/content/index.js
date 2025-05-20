import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";
import {
  findFirstTextNode,
  hasSelector,
  unTexMarkdownEscaping,
  writeTextClipboard,
} from "../utils/util.js";
import { PopupCopy } from "./popupCopy.js";
import "./copyStyle.module.css";
import {
  getChromeStorage,
  watchChromeStorage,
} from "../utils/chromeStorage.js";
import { getRangeTexClone } from "../utils/tex.js";
const position = { x: 0, y: 0 };
let popupCopy = null;
export let setting = {};
getChromeStorage().then((res) => {
  setting = res;
  initEvent();
});

watchChromeStorage((changes) => {
  const { newValue, oldValue } = changes;
  setting = newValue;
  if (newValue.selectionPopup !== oldValue.selectionPopup) {
    newValue.selectionPopup ? togglePopup() : popupCopy?.hide();
  }
});
// contentMenu click event
chrome.runtime.onMessage.addListener((response) => {
  if (response === "transformToMarkdown") {
    selectorHandle();
  }
});

function initEvent() {
  document.addEventListener("mouseup", bindPopupEvent);
}

function bindPopupEvent(event) {
  const { target, x, y } = event;
  // 异步获取选中内容
  setTimeout(() => {
    if (target !== popupCopy?.popup) {
      position.x = x;
      position.y = y;
      if (!setting.selectionPopup) return;
      togglePopup();
    }
  });
}

function togglePopup() {
  if (hasSelector()) {
    createPopup();
  } else {
    popupCopy?.hide();
  }
}
function createPopup() {
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

const texClass = ["base", "katex-html", "katex"];
function selectorHandle() {
  return new Promise((resolve, reject) => {
    try {
      // 获取选择的内容
      const selectedText = window.getSelection();
      const ranges = [];
      const { rangeCount } = selectedText;
      for (let i = 0; i < rangeCount; ++i) {
        ranges[i] = selectedText.getRangeAt(i);
        const copyNode = transformRange(ranges[i]);
        astHtmlToMarkdown(copyNode)
          .then((res) => {
            // 正则替换 TEX中的\_为_
            const markdownText = unTexMarkdownEscaping(res);
            writeTextClipboard(markdownText || selectedText.toString());
            chrome.runtime.sendMessage({
              extensionId: chrome.runtime.id,
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
function transformRange(range) {
  const { commonAncestorContainer } = range;
  if (commonAncestorContainer.nodeType === Node.TEXT_NODE)
    return range.cloneContents();
  const isTexNode = hasTexNode(commonAncestorContainer);
  let dom = isTexNode
    ? getParentNodeIsTexNode(commonAncestorContainer)
    : cloneRangeDom(range);
  dom = setKatexText(dom);
  // 如果是code节点则设置code 语言
  if (typeof dom.querySelector === "function") {
    dom = setCodeText(dom);
  }
  return dom;
}

// clone range中的选中内容
function cloneRangeDom(range) {
  // 针对处理tex 样式
  return getRangeTexClone(range);
}

// gemini 代码块语言设置
function setCodeBlockLanguage(dom) {
  let codes = dom?.querySelectorAll?.("code-block");
  for (const code of codes) {
    const langNode = findFirstTextNode(code);
    let lang = langNode?.textContent.toLocaleLowerCase().replace(/['"]/g, "");
    langNode.textContent = "";
    const codeDom = code.querySelector("code");
    codeDom.classList.add(`language-${lang}`);
  }
}
// 优化code 代码
function setCodeText(dom) {
  // 根据pre下的第一个textNode 来判断code 语言
  setCodeBlockLanguage(dom);
  const pres = dom.querySelectorAll("pre");
  for (const pre of pres) {
    const code = pre.querySelector("code");
    if (code) {
      code?.remove();
      let lang = findFirstTextNode(pre)
        ?.textContent.toLocaleLowerCase()
        .replace(/['"]/g, "");
      lang && code?.classList.add(`language-${lang}`);
      pre.innerHTML = "";
      pre.appendChild(code);
    }
  }
  return dom;
}

// 设置Tex Node 转为 markdown 格式
function setKatexText(node) {
  if (node.className === "katex") {
    return transformTex(
      node.querySelector("annotation").textContent,
      hasBlock(node),
    );
  }
  // 处理多个Tex
  const katexList = node.querySelectorAll(".katex");
  for (const katex of katexList) {
    let annotationNode = katex.querySelector("annotation");
    const { focusNode, anchorNode } = getSelection();
    const lastTextNode =
      focusNode.nodeType === Node.TEXT_NODE ? focusNode : anchorNode;
    // 如果不存在annotation 标签则将用text 节点向上查找 katex节点
    if (!annotationNode) {
      annotationNode =
        getParentNodeIsTexNode(lastTextNode)?.querySelector("annotation");
    }
    katex.textContent = transformTex(
      annotationNode?.textContent || lastTextNode.nodeValue || "",
      hasBlock(katex),
    );
  }
  return node;
}

function hasBlock(node) {
  return (
    getComputedStyle(node).display === "block" || node.style.display === "block"
  );
}
// 判断是否是tex 节点
function hasTexNode(node) {
  return texClass.some((item) => node.className === item);
}

function getParentNodeIsTexNode(node, max = 10) {
  for (let i = max; i >= 0; i--) {
    if (node.className === "katex") {
      return node;
    } else {
      node = node.parentNode;
    }
  }
  return null;
}

function transformTex(text, isBlock = false) {
  return isBlock ? `$$${text}$$` : `$${text}$`;
}

function fixMathDollarSpacing(input) {
  // 匹配单个$（前后不是$，也不是$$），只处理$xxx$，忽略$$xxx$$
  return input.replace(
      /(\S)?((?<!\$)\$[^$\n]+\$(?!\$))/g, // 只处理$...$，忽略$$...$$
      (match, p1, p2) => {
        if (p1 && !/\s/.test(p1)) {
          return p1 + ' ' + p2;
        }
        return (p1 || '') + p2;
      }
  );
}

function fixTexDoubleEscapeInMarkdown(markdown) {
  // 块级公式
  markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (block, tex) => {
    // 只还原 remark escape 的那批符号 (包括逗号「只用于 \,」)，保留其他所有 latex 命令
    tex = tex
        // remark-stringify会把 \, escape 成 \\,
        .replace(/\\\\,/g, '\\,')
        // remark-stringify会把下列符号前加单/双斜杠
        .replace(/\\\\([_{}[$])/g, '$1')
        .replace(/\\([_{}$])/g, '$1')
        // 专门处理方括号的转义
        .replace(/\\([[$])/g, '$1');
    return `$$${tex}$$`;
  });

  // 非块级，分段处理
  let segments = [];
  let lastIndex = 0;
  markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, _tex, offset) => {
    if (lastIndex < offset)
      segments.push({ type: 'text', text: markdown.slice(lastIndex, offset) });
    segments.push({ type: 'block', text: match });
    lastIndex = offset + match.length;
  });

  if (lastIndex < markdown.length)
    segments.push({ type: 'text', text: markdown.slice(lastIndex) });

  segments = segments.map(seg => {
    if (seg.type === 'text') {
      return seg.text.replace(/(?<!\$)\$([^\n$]+?)\$(?!\$)/g, (_all, tex) => {
        tex = tex
            .replace(/\\\\,/g, '\\,')
            .replace(/\\\\([_{}[\]$])/g, '$1')
            .replace(/\\([_{}$])/g, '$1')
            // 同样在行内公式中也需要处理方括号
            .replace(/\\([$])/g, '$1');
        return `$${tex}$`;
      });
    }
    return seg.text;
  });
  return segments.join('');
}

async function astHtmlToMarkdown(node) {
  const container = document.createElement("div");
  container.append(node);
  const html = container.innerHTML;
  const html2Markdown = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      nodeHandlers: {
        // 去除注释节点
        comment(state, node, parent) {
          return null;
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify)
    .process(html);
  return fixTexDoubleEscapeInMarkdown(fixMathDollarSpacing(html2Markdown.value));
}
