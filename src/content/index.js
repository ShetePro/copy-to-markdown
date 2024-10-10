import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { debounce, getTextNodeRect, hasSelector } from "../util.js";
import { PopupCopy } from "./popupCopy.js";
import "./copyStyle.module.css";
const position = { x: 0, y: 0 };
let popupCopy = null;
document.addEventListener("mouseup", (event) => {
  const { pageX } = event;
  // 异步获取选中内容
  setTimeout(() => {
    if (hasSelector()) {
      const selector = window.getSelection();
      const { anchorNode, focusNode } = selector;
      const range = selector.getRangeAt(selector.rangeCount - 1);
      const rect = range.getBoundingClientRect();
      const isLeft = Math.abs(pageX - rect.left) < Math.abs(pageX - rect.right);
      position.x = isLeft ? rect.left : rect.right;
      position.y = rect.bottom;
      createPopup();
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
    console.log('click')
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
            console.log("已转换成markdown");
            console.log(res || selectedText.toString());
            navigator.clipboard.writeText(res || selectedText.toString());
            resolve(res);
          })
          .catch((e) => {
            console.error(e)
            reject(e)
          });
      }
    } catch (e) {
      reject(e);
    }
  });
}
function transformRange(range) {
  const { commonAncestorContainer } = range;
  const dom = hasTexNode(commonAncestorContainer)
    ? getParentNodeIsTexNode(commonAncestorContainer)
    : range.cloneContents();
  console.log(dom)
  return setKatexText(dom);
}
// 设置Tex Node 转为 markdown 格式
function setKatexText(node) {
  if (node.className === "katex") {
    return transformTex(node.querySelector("annotation").textContent);
  }
  const katexList = node.querySelectorAll(".katex");
  for (const katex of katexList) {
    const annotationNode = katex.querySelector("annotation");
    katex.textContent = transformTex(annotationNode?.textContent);
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
  const processedContent = html.replace(
    /<div class="math math-display">(.*?)<\/div>/gs,
    (match, p1) => {
      // 检查内容是否以小括号或中括号开头
      if (!/^[\[\(]/.test(p1.trim())) {
        // 如果不是，则用中括号包起来
        return `<div class="math math-display">[ ${p1.trim()} ]</div>`;
      }
      return match;
    },
  );
  const html2Markdown = await unified()
    .use(rehypeParse)
    .use(rehypeRemark)
    .use(remarkStringify)
    .process(processedContent);
  return html2Markdown.value;
}
