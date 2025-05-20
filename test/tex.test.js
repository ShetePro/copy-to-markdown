import { describe, expect, test, beforeEach, vi } from "vitest";
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
  })
  
  test('处理单个 .katex 元素', () => {
    const wrapper = document.createElement('div')
    wrapper.className = 'katex block'
    wrapper.innerHTML = `
      <annotation>c = \\pm\\sqrt{a^2 + b^2}</annotation>
    `
    document.body.appendChild(wrapper)
    
    const result = setKatexText(wrapper)
    expect(result.textContent).toBe('[block]c = \\pm\\sqrt{a^2 + b^2}')
  })
  
  // test('处理多个 .katex 元素', () => {
  //   const container = document.createElement('div')
  //   container.innerHTML = `
  //     <span class="katex">
  //       <annotation>a + b</annotation>
  //     </span>
  //     <span class="katex block">
  //       <annotation>x^2 + y^2</annotation>
  //     </span>
  //   `
  //   document.body.appendChild(container)
  //
  //   setKatexText(container)
  //
  //   const katexList = container.querySelectorAll('.katex')
  //   expect(katexList[0].textContent).toBe('[inline]a + b')
  //   expect(katexList[1].textContent).toBe('[block]x^2 + y^2')
  // })
  //
  // test('fallback：annotation 缺失时使用 getParentNodeIsTexNode', () => {
  //   const container = document.createElement('div')
  //   const katex = document.createElement('span')
  //   katex.className = 'katex'
  //   katex.innerHTML = ``
  //   container.appendChild(katex)
  //
  //   const textNode = document.createTextNode('fallback content')
  //   katex.appendChild(textNode)
  //
  //   // 模拟 selection
  //   const selection = {
  //     focusNode: textNode,
  //     anchorNode: textNode,
  //   }
  //   vi.spyOn(window, 'getSelection').mockReturnValue(selection)
  //
  //   const annotation = document.createElement('annotation')
  //   annotation.textContent = 'a^2 + b^2'
  //   katex.appendChild(annotation)
  //
  //   setKatexText(container)
  //
  //   expect(katex.textContent).toBe('[inline]a^2 + b^2')
  // })
})
