export function debounce(func, wait, immediate) {
  let timeout = null;
  return function () {
    if (timeout) clearTimeout(timeout);
    // 是否立即执行
    if (immediate) {
      const isFirst = !timeout;
      timeout = setTimeout(function () {
        timeout = null;
      }, wait);
      isFirst && func.apply(this, arguments);
    } else {
      timeout = setTimeout(() => {
        func.apply(this, arguments);
      }, wait);
    }
  };
}

export function hasSelector() {
  const selector = window.getSelection().toString();
  // 去除空白字符
  const selectText = selector.replace(/\s+/g, "");
  return selector?.isCollapsed === false || selectText.length > 0;
}

export function getTextNodeRect(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range?.getBoundingClientRect();
}

// 获取第一个文本节点
export function findFirstTextNode(element) {
  if (!element) return null;
  if (element?.tagName === "CODE") return null;
  let node = element.firstChild;
  if (!node) return null;
  if (node.nodeType === Node.COMMENT_NODE) {
    node = element.firstElementChild;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  } else {
    return findFirstTextNode(node);
  }
}

// 将文本写入剪切板
export function writeTextClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.select();
    textarea.setSelectionRange(0, text.length); // 为移动设备兼容性
    try {
      document.execCommand("copy");
    } catch (err) {}
  }
}

export function hasBlock(node) {
  return (
    getComputedStyle(node).display === "block" || node.style.display === "block"
  );
}

/**
 * 移除列表项之间的空行
 * 将无序列表、有序列表和任务列表中的空行移除，使列表更紧凑
 * @param {string} markdown - 原始 Markdown 文本
 * @returns {string} - 处理后的 Markdown 文本
 */
export function removeListEmptyLines(markdown) {
  if (!markdown) return markdown;
  
  // 匹配列表项之间的空行：
  // 1. 无序列表: 行首是 -, *, + 后跟空格
  // 2. 有序列表: 行首是数字. 后跟空格  
  // 3. 任务列表: 行首是 - [ ], - [x], * [ ], * [x] 等
  
  // 先处理无序列表和任务列表项之间的空行
  // 匹配模式：列表项行 + 空行 + 下一个列表项行
  let result = markdown.replace(
    /^(\s*[-*+]\s+(?:\[[ xX]\]\s+)?[^\n]+)\n\n(?=\s*[-*+]\s+(?:\[[ xX]\]\s+)?)/gm,
    '$1\n'
  );
  
  // 处理有序列表项之间的空行
  result = result.replace(
    /^(\s*\d+\.\s+[^\n]+)\n\n(?=\s*\d+\.\s+)/gm,
    '$1\n'
  );
  
  return result;
}
