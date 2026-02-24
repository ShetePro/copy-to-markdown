import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import {
  texClass,
  hasTexNode,
  getParentNodeIsTexNode, transformTex, unTexMarkdownEscaping, setKatexText,
} from "../src/utils/tex.js";

test("test hasTexNode", () => {
  texClass.map((item) => {
    const node = {
      className: item,
    };
    expect(hasTexNode(node)).toBe(true);
  });
  expect(hasTexNode({ className: "test" })).toBe(false);
});

test("test getParentNodeIsTexNode", () => {
  const node1 = {
    className: "test1",
    parentNode: {
      className: "katex",
    },
  };
  const node2 = {
    className: "katex",
  };
  const node3 = {
    className: "test2",
    parentNode: {
      className: "test3",
      parentNode: {
        className: "test4",
      },
    },
  };
  expect(getParentNodeIsTexNode(node1)).toBe(node1.parentNode);
  expect(getParentNodeIsTexNode(node2)).toBe(node2);
  expect(getParentNodeIsTexNode(node3)).toBe(null);
});

test("test transformTex", () => {
  expect(transformTex('tex1', true)).toBe('$$tex1$$');
  expect(transformTex('tex2', false)).toBe('$tex2$');
})
describe('unTexMarkdownEscaping', () => {
  test('should unescape _ [ ] { } inside $...$ blocks', () => {
    const input = '这是一个公式 $a\\_b + c\\{d\\} = e\\[f\\]$，这是文本'
    const expected = '这是一个公式 $a_b + c{d} = e[f]$，这是文本'
    const output = unTexMarkdownEscaping(input)
    expect(output).toBe(expected)
  })
  
  test('should not affect content outside of $...$ blocks', () => {
    const input = '文本 \\_ 不应该被处理，$x\\_y$ 会被处理'
    const expected = '文本 \\_ 不应该被处理，$x_y$ 会被处理'
    expect(unTexMarkdownEscaping(input)).toBe(expected)
  })
  
  test('should handle multiple $...$ blocks', () => {
    const input = '多个 $a\\_1$ 中间 $b\\{2\\}$ 的例子'
    const expected = '多个 $a_1$ 中间 $b{2}$ 的例子'
    expect(unTexMarkdownEscaping(input)).toBe(expected)
  })
  
  test('should return input unchanged if no $...$ block exists', () => {
    const input = '纯文本，没有任何公式 \\_\\{\\}'
    expect(unTexMarkdownEscaping(input)).toBe(input)
  })
})

describe('setKatexText', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    // 默认 mock getSelection
    vi.spyOn(window, 'getSelection').mockReturnValue({
      focusNode: document.body,
      anchorNode: document.body,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('处理单个 .katex 元素（inline）', () => {
    const wrapper = document.createElement('span')
    wrapper.className = 'katex'
    wrapper.innerHTML = `
      <annotation>c = \\pm\\sqrt{a^2 + b^2}</annotation>
    `
    document.body.appendChild(wrapper)

    const result = setKatexText(wrapper)
    expect(result).toBe('$c = \\pm\\sqrt{a^2 + b^2}$')
  })

  test('处理单个 .katex 元素（block）', () => {
    const wrapper = document.createElement('div')
    wrapper.className = 'katex'
    wrapper.style.display = 'block'
    wrapper.innerHTML = `
      <annotation>x^2 + y^2 = z^2</annotation>
    `
    document.body.appendChild(wrapper)

    const result = setKatexText(wrapper)
    expect(result).toBe('$$x^2 + y^2 = z^2$$')
  })

  test('处理容器内的多个 .katex 元素', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <span class="katex">
        <annotation>a + b</annotation>
      </span>
      <div class="katex" style="display: block;">
        <annotation>x^2 + y^2</annotation>
      </div>
    `
    document.body.appendChild(container)

    // 模拟 selection 指向第一个 katex
    const firstKatex = container.querySelector('.katex')
    vi.spyOn(window, 'getSelection').mockReturnValue({
      focusNode: firstKatex,
      anchorNode: firstKatex,
    })

    setKatexText(container)

    const katexList = container.querySelectorAll('.katex')
    expect(katexList[0].textContent).toBe('$a + b$')
    expect(katexList[1].textContent).toBe('$$x^2 + y^2$$')
  })

  test('处理带 data-math 属性的 Gemini 格式（math-inline）', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <span class="math-inline" data-math="E = mc^2">
        <span class="katex">E = mc²</span>
      </span>
    `
    document.body.appendChild(container)

    const mathInline = container.querySelector('.math-inline')
    vi.spyOn(window, 'getSelection').mockReturnValue({
      focusNode: mathInline,
      anchorNode: mathInline,
    })

    setKatexText(container)

    const katex = container.querySelector('.katex')
    expect(katex.textContent).toBe('$E = mc^2$')
  })

  test('处理 block 模式的 Gemini 格式（math-block）', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <div class="math-block" data-math="\\\\sum_{i=1}^{n} x_i" style="display: block;">
        <div class="katex" style="display: block;">∑ xᵢ</div>
      </div>
    `
    document.body.appendChild(container)

    const mathBlock = container.querySelector('.math-block')
    vi.spyOn(window, 'getSelection').mockReturnValue({
      focusNode: mathBlock,
      anchorNode: mathBlock,
    })

    setKatexText(container)

    const katex = container.querySelector('.katex')
    expect(katex.textContent).toBe('$$\\\\sum_{i=1}^{n} x_i$$')
  })

  test('当没有 annotation 和 math 时返回原 node', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <span class="katex">
        <span>Some text without math</span>
      </span>
    `
    document.body.appendChild(container)

    const katex = container.querySelector('.katex')
    vi.spyOn(window, 'getSelection').mockReturnValue({
      focusNode: katex,
      anchorNode: katex,
    })

    const result = setKatexText(container)

    // 没有 annotation 和 math，应该返回原 node
    expect(result).toBe(container)
  })

  test('使用 selection 的 lastTextNode 获取 annotation', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <span class="katex">
        <annotation>formula from annotation</annotation>
      </span>
    `
    document.body.appendChild(container)

    const katex = container.querySelector('.katex')
    const annotation = katex.querySelector('annotation')
    
    // 模拟 selection 指向 annotation 内部
    vi.spyOn(window, 'getSelection').mockReturnValue({
      focusNode: annotation.firstChild,
      anchorNode: annotation.firstChild,
    })

    setKatexText(container)

    expect(katex.textContent).toBe('$formula from annotation$')
  })
})
