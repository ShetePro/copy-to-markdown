import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import {
  findFirstTextNode,
  hasSelector,
  unTexMarkdownEscaping,
  writeTextClipboard,
} from "../utils/util.js";
import { PopupCopy } from "./popupCopy.js";
import "./copyStyle.module.css";
import {
  defaultStorage,
  getChromeStorage,
  storageKey,
  watchChromeStorage,
} from "../utils/chromeStorage.js";
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
  const isTexNode = hasTexNode(commonAncestorContainer);
  let dom = isTexNode
    ? getParentNodeIsTexNode(commonAncestorContainer)
    : range.cloneContents();
  dom = setKatexText(dom);
  dom = setCodeText(dom);
  return dom;
}

// 优化code 代码
function setCodeText(dom) {
  // 根据pre下的第一个textNode 来判断code 语言
  const pres = dom.querySelectorAll("pre");
  for (const pre of pres) {
    const code = pre.querySelector("code");
    let langNode = findFirstTextNode(pre);
    code.remove();
    pre.innerHTML = "";
    pre.appendChild(code);
    pre.classList.add(langNode);
  }
  return dom;
}

// 设置Tex Node 转为 markdown 格式
function setKatexText(node) {
  if (node.className === "katex") {
    return transformTex(node.querySelector("annotation").textContent);
  }
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
    );
  }
  return node;
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

function transformTex(text) {
  return `$${text}$`;
}
async function astHtmlToMarkdown(node) {
  const container = document.createElement("div");
  container.append(node);
  const html = container.innerHTML;
  const html2Markdown = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      // handlers: {
      //   pre(state, node, parent) {
      //   },
      // },
    })
    .use(remarkStringify)
    .process(html);
  return html2Markdown.value;
}
