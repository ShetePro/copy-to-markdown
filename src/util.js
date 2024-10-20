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
