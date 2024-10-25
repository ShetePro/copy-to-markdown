import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { hasSelector, unTexMarkdownEscaping } from "../utils/util.js";
import { PopupCopy } from "./popupCopy.js";
import "./copyStyle.module.css";
const position = { x: 0, y: 0 };
let popupCopy = null;
document.addEventListener("mouseup", (event) => {
  const { target, x, y } = event;
  // 异步获取选中内容
  setTimeout(() => {
    if (hasSelector()) {
      if (target !== popupCopy?.popup) {
        position.x = x;
        position.y = y;
        createPopup();
      }
    } else {
      popupCopy?.hide();
    }
  });
});
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
            navigator.clipboard.writeText(
              markdownText || selectedText.toString(),
            );
            console.log(markdownText || selectedText.toString());
            resolve(markdownText);
          })
          .catch((e) => {
            reject(e);
          });
      }
    } catch (e) {
      reject(e);
    }
  });
}
function transformRange(range) {
  const { commonAncestorContainer } = range;
  const isTexNode = hasTexNode(commonAncestorContainer);
  const dom = isTexNode
    ? getParentNodeIsTexNode(commonAncestorContainer)
    : range.cloneContents();
  return setKatexText(dom);
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
    const lastTextNode = focusNode.nodeType === Node.TEXT_NODE ? focusNode : anchorNode
    // 如果不存在annotation 标签则将用text 节点向上查找 katex节点
    if (!annotationNode) {
      annotationNode = getParentNodeIsTexNode(lastTextNode)?.querySelector("annotation");
    }
    katex.textContent = transformTex(annotationNode?.textContent || lastTextNode.nodeValue || '');
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
    .use(rehypeRemark)
    .use(remarkStringify)
    .process(html);
  return html2Markdown.value;
}
