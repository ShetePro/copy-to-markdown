import { describe, it, expect, beforeEach } from 'vitest';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import { removeListEmptyLines, wrapOrphanListItems } from '../src/utils/util.js';

/**
 * 模拟 astHtmlToMarkdown 的核心转换逻辑（带预处理）
 */
async function htmlToMarkdown(html, usePreprocess = true) {
  // 创建临时容器来解析 HTML
  const container = document.createElement('div');
  container.innerHTML = html;
  
  let node;
  if (usePreprocess) {
    // 使用 wrapOrphanListItems 预处理
    node = wrapOrphanListItems(container);
    // 如果返回的是容器本身，我们需要它的内容
    if (node === container) {
      // 提取处理后的 HTML
      const tempDiv = document.createElement('div');
      tempDiv.append(...Array.from(container.childNodes).map(n => n.cloneNode(true)));
      node = tempDiv;
    }
  } else {
    node = container;
  }
  
  const html2Markdown = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      nodeHandlers: {
        comment(state, node, parent) {
          return null;
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify)
    .process(node.innerHTML);
  
  return removeListEmptyLines(html2Markdown.value).trim();
}

/**
 * 模拟 astHtmlToMarkdown 的简化版本（直接使用 DocumentFragment）
 */
async function fragmentToMarkdown(fragmentHtml, usePreprocess = true) {
  // 创建文档片段
  const fragment = document.createRange().createContextualFragment(fragmentHtml);
  
  if (usePreprocess) {
    wrapOrphanListItems(fragment);
  }
  
  const tempDiv = document.createElement('div');
  // 直接附加处理后的 fragment 的子节点，而不是 clone
  while (fragment.firstChild) {
    tempDiv.appendChild(fragment.firstChild);
  }
  
  const html2Markdown = await unified()
    .use(rehypeParse)
    .use(rehypeRemark, {
      nodeHandlers: {
        comment(state, node, parent) {
          return null;
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify)
    .process(tempDiv.innerHTML);
  
  return removeListEmptyLines(html2Markdown.value).trim();
}

describe('有序列表复制问题修复', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('完整 ol 列表应该转换为 1. 2. 3.', async () => {
    const html = `
      <h2>核心知识点与技巧</h2>
      <ol class="marker:text-quiet list-decimal">
        <li><p><strong>状态机建模</strong>：将业务规则转化为状态间的有向边</p></li>
        <li><p><strong>滚动变量优化</strong>：发现状态只依赖前一天的值</p></li>
        <li><p><strong>更新顺序</strong>：计算 rest_i 时需要用到 sold_{i-1}</p></li>
      </ol>
    `;
    
    const result = await htmlToMarkdown(html);
    
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
    expect(result).not.toContain('* 状态机');
    expect(result).not.toContain('* 滚动变量');
    expect(result).not.toContain('* 更新顺序');
  });

  it('BUG修复: 单独复制 li 元素（不含 ol 父元素）时应该正确识别为有序列表项', async () => {
    // 这是用户遇到的问题：只复制了 li 元素，没有包含外层的 ol
    // 模拟 DocumentFragment 的情况
    const fragmentHtml = `
      <li class="py-0 my-0"><p><strong>状态机建模</strong>：将业务规则转化为状态间的有向边</p></li>
      <li class="py-0 my-0"><p><strong>滚动变量优化</strong>：发现状态只依赖前一天的值</p></li>
      <li class="py-0 my-0"><p><strong>更新顺序</strong>：计算 rest_i 时需要用到 sold_{i-1}</p></li>
    `;
    
    // 不使用预处理时应该失败（返回 *）
    const resultWithoutFix = await fragmentToMarkdown(fragmentHtml, false);
    expect(resultWithoutFix).toContain('*');
    expect(resultWithoutFix).not.toContain('1.');
    
    // 使用预处理后应该成功（返回 1. 2. 3.）
    const resultWithFix = await fragmentToMarkdown(fragmentHtml, true);
    expect(resultWithFix).toContain('1.');
    expect(resultWithFix).toContain('2.');
    expect(resultWithFix).toContain('3.');
    expect(resultWithFix).not.toMatch(/^\s*[*+-]\s+/m);
  });

  it('修复: 当 li 元素不在 ol/ul 中时应该正确识别为有序列表', async () => {
    // 模拟用户在页面上选择时，只选中了部分列表项
    const fragmentHtml = `
      <li><p>First item</p></li>
      <li><p>Second item</p></li>
    `;
    
    // 不使用预处理时返回 *
    const resultWithoutFix = await fragmentToMarkdown(fragmentHtml, false);
    expect(resultWithoutFix).toMatch(/^\s*[*+-]/m);
    
    // 使用预处理后返回 1. 2.
    const resultWithFix = await fragmentToMarkdown(fragmentHtml, true);
    expect(resultWithFix).toContain('1.');
    expect(resultWithFix).toContain('2.');
  });
});

describe('标准列表转换测试', () => {
  it('标准 ol/li 应该转换为有序列表', async () => {
    const html = `
      <ol>
        <li>First item</li>
        <li>Second item</li>
        <li>Third item</li>
      </ol>
    `;
    
    const result = await htmlToMarkdown(html);
    
    expect(result).toContain('1.');
    expect(result).toContain('2.');
    expect(result).toContain('3.');
  });

  it('标准 ul/li 应该转换为无序列表', async () => {
    const html = `
      <ul>
        <li>First item</li>
        <li>Second item</li>
      </ul>
    `;
    
    const result = await htmlToMarkdown(html);
    
    expect(result).toMatch(/\*\s+First/);
    expect(result).toMatch(/\*\s+Second/);
  });

  it('带 start 属性的有序列表', async () => {
    const html = `
      <ol start="5">
        <li>Fifth item</li>
        <li>Sixth item</li>
      </ol>
    `;
    
    const result = await htmlToMarkdown(html);
    
    expect(result).toContain('5.');
    expect(result).toContain('6.');
  });
});
