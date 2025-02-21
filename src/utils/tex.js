export function getRangeTexClone (range) {
  const { commonAncestorContainer } = range;
  const clonedContent = range.cloneContents();
  // 因为cloneContent不会克隆katex的样式，所以需要手动添加
  const cloneTex = clonedContent?.querySelectorAll(".katex");
  // selectTex 为祖先节点下所有的katex 节点
  const selectTex = commonAncestorContainer?.querySelectorAll(".katex");
  // 匹配选中的tex节点在祖先节点下的开始索引
  let match = 0;
  // 设置开始索引
  let startIndex = 0;
  // 匹配katex node
  for (let i = 0; i < selectTex.length; i++) {
    const item = selectTex[i]
    const some = item.innerHTML === cloneTex[match].innerHTML;
    if (some) {
      match = Math.min(match + 1, cloneTex.length);
    }else if(match > 0 && match < cloneTex.length){
      match = 0
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
  return clonedContent
}
