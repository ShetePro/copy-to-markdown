import { describe, it, expect } from 'vitest';
import { removeListEmptyLines } from '../src/utils/util.js';

describe('removeListEmptyLines', () => {
  it('应该移除无序列表项之间的空行', () => {
    const input = `* **Automatic Markdown Conversion**: Instantly transform selected text into Markdown format with a single click.

* **Supports Markdown Syntax**: Handles headers, lists, links, bold/italic text, and more.

* **Easy to Use**: Copy as Markdown without leaving your current page.`;

    const expected = `* **Automatic Markdown Conversion**: Instantly transform selected text into Markdown format with a single click.
* **Supports Markdown Syntax**: Handles headers, lists, links, bold/italic text, and more.
* **Easy to Use**: Copy as Markdown without leaving your current page.`;

    expect(removeListEmptyLines(input)).toBe(expected);
  });

  it('应该移除有序列表项之间的空行', () => {
    const input = `1. First item

2. Second item

3. Third item`;

    const expected = `1. First item
2. Second item
3. Third item`;

    expect(removeListEmptyLines(input)).toBe(expected);
  });

  it('应该移除任务列表项之间的空行', () => {
    const input = `- [ ] Task 1

- [x] Task 2

- [ ] Task 3`;

    const expected = `- [ ] Task 1
- [x] Task 2
- [ ] Task 3`;

    expect(removeListEmptyLines(input)).toBe(expected);
  });

  it('应该保留非连续列表项之间的空行', () => {
    const input = `* Item 1

Some text here

* Item 2`;

    // 这个不应该改变，因为中间有非列表内容
    expect(removeListEmptyLines(input)).toBe(input);
  });

  it('应该处理空字符串', () => {
    expect(removeListEmptyLines('')).toBe('');
    expect(removeListEmptyLines(null)).toBe(null);
    expect(removeListEmptyLines(undefined)).toBe(undefined);
  });

  it('应该处理缩进的列表', () => {
    const input = `  * Item 1

  * Item 2`;

    const expected = `  * Item 1
  * Item 2`;

    expect(removeListEmptyLines(input)).toBe(expected);
  });
});
