import { createButton } from "./button.js";
import PopupClass from "./copyStyle.module.css";
import ButtonStyle from "./button.module.css?inline";

export class PopupCopy {
  constructor(options) {
    this.popup = document.createElement("div");
    this.shadowRoot = this.popup.attachShadow({ mode: "open" });
    const button = createButton({
      clickCallback: options.click,
    });
    const sheets = new CSSStyleSheet();
    sheets.replaceSync(ButtonStyle);
    this.shadowRoot.adoptedStyleSheets = [sheets];
    this.shadowRoot.append(button);
    this.popup.classList.add(PopupClass.popupCopy);
    this.width = 130;
    this.height = 55;
    this.offset = [20, 20];
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
