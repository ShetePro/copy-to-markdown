import { hasBlock } from "./util.js";

export const texClass = ["base", "katex-html", "katex"];

// 获取选中的tex节点
export function getRangeTexClone(range) {
  const { commonAncestorContainer } = range;
  const clonedContent = range.cloneContents();
  // 因为cloneContent不会克隆katex的样式，所以需要手动添加
  const cloneTex = clonedContent?.querySelectorAll(".katex");
  // selectTex 为祖先节点下所有的katex 节点
  const selectTex = commonAncestorContainer?.querySelectorAll(".katex");
  // 如果不存在katex 节点则直接返回
  if (cloneTex?.length === 0) {
    return clonedContent;
  }
  // 匹配选中的tex节点在祖先节点下的开始索引
  let match = 0;
  // 设置开始索引
  let startIndex = 0;
  // 匹配katex node
  for (let i = 0; i < selectTex.length; i++) {
    const item = selectTex[i];
    const some = item.innerHTML === cloneTex[match].innerHTML;
    if (some) {
      match = Math.min(match + 1, cloneTex.length);
    } else if (match > 0 && match < cloneTex.length) {
      match = 0;
    }
    if (match === cloneTex.length) {
      startIndex = i - match + 1;
      break;
    }
  }
  for (const index in Array.from(cloneTex)) {
    // 将计算样式应用到克隆的元素
    const prop = "display";
    const computedStyle = window.getComputedStyle(selectTex[startIndex++]);
    cloneTex[index].style[prop] = computedStyle.getPropertyValue(prop);
  }
  return clonedContent;
}

// 获取tex 根节点
export function getParentNodeIsTexNode(node, max = 10) {
  for (let i = max; i >= 0; i--) {
    if (!node) return null;
    if (node.className === "katex") {
      return node;
    } else {
      node = node.parentNode;
    }
  }
  return null;
}

// 转换tex 数学公式换行
export function transformTex(text, isBlock = false) {
  return isBlock ? `$$${text}$$` : `$${text}$`;
}

export function fixMathDollarSpacing(input) {
  // 匹配单个$（前后不是$，也不是$$），只处理$xxx$，忽略$$xxx$$
  return input.replace(
    /(\S)?((?<!\$)\$[^$\n]+\$(?!\$))/g, // 只处理$...$，忽略$$...$$
    (match, p1, p2) => {
      if (p1 && !/\s/.test(p1)) {
        return p1 + " " + p2;
      }
      return (p1 || "") + p2;
    },
  );
}

export function fixTexDoubleEscapeInMarkdown(markdown) {
  // 块级公式
  markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (block, tex) => {
    // 只还原 remark escape 的那批符号 (包括逗号「只用于 \,」)，保留其他所有 latex 命令
    tex = tex
      // remark-stringify会把 \, escape 成 \\,
      .replace(/\\\\,/g, "\\,")
      // remark-stringify会把下列符号前加单/双斜杠
      .replace(/\\\\([_{}[$])/g, "$1")
      .replace(/\\([_{}$])/g, "$1")
      // 专门处理方括号的转义
      .replace(/\\([[$])/g, "$1");
    return `$$${tex}$$`;
  });

  // 非块级，分段处理
  let segments = [];
  let lastIndex = 0;
  markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, _tex, offset) => {
    if (lastIndex < offset)
      segments.push({ type: "text", text: markdown.slice(lastIndex, offset) });
    segments.push({ type: "block", text: match });
    lastIndex = offset + match.length;
  });

  if (lastIndex < markdown.length)
    segments.push({ type: "text", text: markdown.slice(lastIndex) });

  segments = segments.map((seg) => {
    if (seg.type === "text") {
      return seg.text.replace(/(?<!\$)\$([^\n$]+?)\$(?!\$)/g, (_all, tex) => {
        tex = tex
          .replace(/\\\\,/g, "\\,")
          .replace(/\\\\([_{}[\]$])/g, "$1")
          .replace(/\\([_{}$])/g, "$1")
          // 同样在行内公式中也需要处理方括号
          .replace(/\\([$])/g, "$1");
        return `$${tex}$`;
      });
    }
    return seg.text;
  });
  return segments.join("");
}

// 判断是否是tex 节点
export function hasTexNode(node) {
  return texClass.some((item) => node.className === item);
}

function getGeminiTexMath(node) {
  if (node) {
    const mathBlock = node.parentNode.parentNode;
    return mathBlock?.dataset?.math;
  }
  return false;
}
// 设置Tex Node 转为 markdown 格式
export function setKatexText(node) {
  if (node.className === "katex") {
    const math =
      node.querySelector("annotation").textContent || getGeminiTexMath(node);
    return transformTex(math, hasBlock(node));
  }
  // 处理多个Tex
  const katexList = node.querySelectorAll(".katex");
  const { focusNode, anchorNode } = getSelection();
  const lastTextNode =
    focusNode.nodeType === Node.TEXT_NODE ? focusNode : anchorNode;
  for (const katex of katexList) {
    let annotationNode =
      katex.querySelector("annotation") ||
      getParentNodeIsTexNode(lastTextNode)?.querySelector("annotation");
    // 如果不存在annotation 标签则直接返回dom
    const math = getGeminiTexMath(katex);
    if (!annotationNode && !math) {
      return node;
    }
    katex.textContent = transformTex(
      annotationNode?.textContent || math || lastTextNode.nodeValue || "",
      hasBlock(katex),
    );
  }
  return node;
}

// 取消TEX中的markdown 转义
export function unTexMarkdownEscaping(res) {
  return res.replace(/\$(.*?)\$/g, (match) => {
    // _ [] {} 进行反转义
    return match
      .replace(/\\_/g, "_")
      .replace(/\\\[/g, "[")
      .replace(/\\]/g, "]")
      .replace(/\\\{/g, "{")
      .replace(/\\}/g, "}");
  });
}
