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
    navigator.clipboard.writeText(text).catch((err) => {
      console.warn("Clipboard write failed:", err);
    });
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.select();
    textarea.setSelectionRange(0, text.length); // 为移动设备兼容性
    try {
      // 使用现代 Clipboard API 作为首选回退方案
      const textBlob = new Blob([text], {type: "text/plain"});
      const clipboardItem = new ClipboardItem({"text/plain": textBlob});
      navigator.clipboard.write([clipboardItem]).catch(() => {
        // 如果新 API 失败，静默处理（这是最后的回退）
      });
    } catch (err) {
      // 所有回退方案都失败时静默处理
    }
  }
}

export function hasBlock(node) {
  return (
      getComputedStyle(node).display === "block" || node.style.display === "block"
  );
}

/**
 * 判断文本节点是否为空白节点（只包含空格、换行、制表符）
 * @param {Node} node - 要检查的节点
 * @returns {boolean} - 是否为空白文本节点
 */
function isWhitespaceNode(node) {
  if (node.nodeType !== Node.TEXT_NODE) {
    return false;
  }
  return !node.textContent || /^\s*$/.test(node.textContent);
}

/**
 * 预处理 HTML，将孤立的 li 元素（不在 ul/ol 中的）包装为列表
 * 这是为了修复用户只选中列表项内容时，列表类型被错误转换的问题
 *
 * 问题场景：用户在复制列表时，如果只选中了列表项内容（li 元素），
 * 而没有包含外层列表容器（ul/ol 元素），转换器无法确定这些 li 原本属于有序还是无序列表。
 *
 * 解决方案：检测孤立的 li 元素（直接子元素且不在 ul/ol 中），根据上下文将它们包装在相应的列表元素中。
 *
 * @param {HTMLElement|DocumentFragment} node - 包含选中内容的 DOM 节点
 * @param {'ul'|'ol'} listType - 默认列表类型，'ul' 表示无序列表，'ol' 表示有序列表
 * @returns {HTMLElement|DocumentFragment} - 处理后的 DOM 节点
 */
export function wrapOrphanListItems(node, listType = "ol") {
  if (!node) return node;

  // 只处理元素节点和文档片段
  if (
      node.nodeType !== Node.ELEMENT_NODE &&
      node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
  ) {
    return node;
  }

  // 如果当前节点是列表容器（ul/ol），不处理其子元素（li 已经在列表中）
  // 但递归处理列表内的其他嵌套元素
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = /** @type {HTMLElement} */ (node);
    const tagName = element.tagName;
    if (tagName === "UL" || tagName === "OL") {
      // 对于列表容器，只递归处理 li 中的嵌套内容，不处理 li 本身
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        if (child.tagName === "LI") {
          // 递归处理 li 中的内容
          for (let j = 0; j < child.children.length; j++) {
            const liChild = child.children[j];
            if (liChild.nodeType === Node.ELEMENT_NODE) {
              wrapOrphanListItems(
                  /** @type {HTMLElement} */ (liChild),
                  listType,
              );
            }
          }
        }
      }
      return node;
    }
  }

  // 处理孤立的 li 元素
  // 步骤 1: 快照所有子节点（避免遍历时 DOM 变化的影响）
  const childrenSnapshot = Array.from(node.childNodes);

  // 步骤 2: 识别所有孤立的 li 元素组
  // 连续的 li 元素（中间只有空白文本节点）会被分到同一组
  const orphanLiGroups = [];
  let currentGroup = [];

  for (let i = 0; i < childrenSnapshot.length; i++) {
    const child = childrenSnapshot[i];
    if (child.nodeType === Node.ELEMENT_NODE && child.tagName === "LI") {
      // 这是一个孤立的 li 元素（因为如果它在 ul/ol 中，不会作为直接子元素被访问到）
      currentGroup.push(/** @type {HTMLElement} */ (child));
    } else if (isWhitespaceNode(/** @type {Node} */ (child))) {
      // 空白文本节点，忽略（继续当前组）
    } else {
      // 非 li 元素且非空白节点，结束当前组
      if (currentGroup.length > 0) {
        orphanLiGroups.push(currentGroup);
        currentGroup = [];
      }
      // 递归处理非 li 元素
      if (child.nodeType === Node.ELEMENT_NODE) {
        wrapOrphanListItems(/** @type {HTMLElement} */ (child), listType);
      }
    }
  }

  // 处理末尾的组
  if (currentGroup.length > 0) {
    orphanLiGroups.push(currentGroup);
  }

  // 步骤 3: 将每个孤立的 li 组包装在相应的列表元素中
  for (const group of orphanLiGroups) {
    if (group.length === 0) continue;

    // 根据 listType 创建 ul 或 ol 元素
    const listElement = document.createElement(listType);

    // 将列表元素插入到第一个 li 之前
    const firstLi = group[0];
    const parentNode = /** @type {HTMLElement | DocumentFragment} */ (node);
    parentNode.insertBefore(listElement, firstLi);

    // 将所有 li 移动到列表元素中
    for (const li of group) {
      listElement.appendChild(li);
    }
  }

  return node;
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
      /^(\s*[-*+]\s+(?:\[[ xX]]\s+)?[^\n]+)\n\n(?=\s*[-*+]\s+(?:\[[ xX]]\s+)?)/gm,
      "$1\n",
  );

  // 处理有序列表项之间的空行
  result = result.replace(/^(\s*\d+\.\s+[^\n]+)\n\n(?=\s*\d+\.\s+)/gm, "$1\n");

  return result;
}
