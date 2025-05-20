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
  let node = element.firstChild;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node;
    }
    if (node.childNodes && node.childNodes.length) {
      return findFirstTextNode(node)
    }
    node = node.nextSibling;
  }
  return null; // 没有找到文本节点
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
