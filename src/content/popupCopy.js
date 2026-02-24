import {createButton} from "./button.js";
import PopupClass from "./copyStyle.module.css";
import ButtonStyle from "./button.module.css?inline";

// 注入样式到文档(只注入一次)
const styleId = "copy-to-markdown-styles";
if (!document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = ButtonStyle;
  document.head.appendChild(style);
}

export class PopupCopy {
  constructor(options) {
    this.popup = document.createElement("div");
    this.button = createButton({
      clickCallback: options.click,
    });

    this.popup.classList.add(PopupClass.popupCopy);
    this.popup.appendChild(this.button);

    // 初始化时就挂载到 body
    document.body.appendChild(this.popup);

    this.width = 130;
    this.height = 55;
    this.offset = [4, 4];
    this.position = {
      x: options.x,
      y: options.y,
    };
  }

  setPosition(position) {
    this.position = position;
  }

  show() {
    const maxWidth = document.documentElement.clientWidth - this.width;
    const maxHeight = document.documentElement.clientHeight - this.height;
    const translateX = Math.max(
        0,
        Math.min(this.position.x + this.offset[0], maxWidth),
    );
    const translateY = Math.max(
        0,
        Math.min(this.position.y + this.offset[1], maxHeight),
    );
    this.popup.style.transform = `translate(${translateX}px, ${translateY}px)`;
    this.popup.classList.add(PopupClass.popupCopyShow);
  }

  hide() {
    this.popup.classList.remove(PopupClass.popupCopyShow);
  }
}
