import { createButton } from "./button.js";
import PopupClass from "./copyStyle.module.css";
export class PopupCopy {
  constructor(options) {
    this.popup = document.createElement("div");
    const button = createButton({
      clickCallback: options.click,
    });
    this.popup.append(button);
    this.popup.classList.add(PopupClass.popupCopy);
    this.width = 200;
    this.height = 55;
    this.offset = [-0, 20];
    this.isShow = false;
    this.position = {
      x: options.x,
      y: options.y,
    };
  }
  setPosition(position) {
    this.position = position;
  }
  show() {
    this.popup.classList.add(PopupClass.popupCopyShow);
    const maxWidth = document.body.clientWidth - this.width;
    const maxHeight = document.body.clientHeight - this.height;
    const translateX = Math.max(
      0,
      Math.min(this.position.x + this.offset[0], maxWidth),
    );
    const translateY = Math.max(
      0,
      Math.min(this.position.y + this.offset[1], maxHeight),
    );
    this.popup.style.transform = `translate(${translateX}px,${translateY}px)`;
    if (!this.isShow) {
      document.body.append(this.popup);
    }
    this.isShow = true;
  }
  hide() {
    this.isShow = false;
    this.popup.classList.remove(PopupClass.popupCopyShow);
    this.popup?.remove();
  }
}
