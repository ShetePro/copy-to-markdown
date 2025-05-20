import {hasBlock} from "./util.js";

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
    if (!node) return null
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
  // 匹配 $xxx$，捕获左侧一位（也可能啥都没有）
  // (?<! ) 匹配非空格（零宽断言，排除已经是空格的）
  // 支持开头等情况，(?:^|[^ \n\r\t])(\$[^$]+?\$)
  return input.replace(/(^|\S)(\$[^$]+?\$)/g, (_match, p1, p2) => {
    // 如果p1是开头，则只返回p2；否则前面加空格
    return (p1 === '' ? '' : p1 + ' ') + p2;
  });
}

// 判断是否是tex 节点
export function hasTexNode(node) {
  return texClass.some((item) => node.className === item);
}

// 设置Tex Node 转为 markdown 格式
export function setKatexText(node) {
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

