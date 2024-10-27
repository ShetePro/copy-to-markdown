import { debounce } from "../utils/util.js";
import ButtonStyle from "./button.module.css";

export function createButton({ clickCallback }) {
  const button = document.createElement("button");
  button.classList.add(ButtonStyle.copyTransformBtn);
  const sign = document.createElement("div");
  const container = document.createElement("div");
  container.classList.add(ButtonStyle.copyTransformBtnContainer);
  sign.classList.add(ButtonStyle.sign);
  sign.innerHTML = getSvgIcon();
  const text = document.createElement("div");
  text.classList.add(ButtonStyle.text);
  text.innerHTML = "Transform";
  const tooltip = document.createElement("span");
  tooltip.classList.add(ButtonStyle.tooltip);
  tooltip.innerHTML = "success!";
  container.append(sign, text);
  button.append(container, tooltip);
  // document.body.append(button);
  const recover = debounce(() => {
    button.classList.remove(
      ButtonStyle.btnSuccess,
      ButtonStyle.btnError,
      ButtonStyle.btnFinish,
    );
  }, 1000);
  const click = debounce(() => {
    clickCallback()
      .then(() => {
        button.classList.add(ButtonStyle.btnSuccess, ButtonStyle.btnFinish);
        tooltip.innerHTML = "success!";
      })
      .catch(() => {
        button.classList.add(ButtonStyle.btnFinish, ButtonStyle.btnError);
        tooltip.innerHTML = "error!";
      });
  }, 200);
  button.addEventListener("click", () => {
    click();
    recover();
  });
  return button;
}

function getSvgIcon() {
  return `<svg t="1728456424182" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8639" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M865.28 680.96c-10.24 51.2-30.72 87.04-46.08 112.64-5.12 5.12-15.36 20.48-20.48 25.6l-25.6 25.6c-25.6 20.48-56.32 35.84-107.52 51.2-61.44 15.36-122.88 20.48-153.6 20.48-30.72 0-92.16 0-153.6-20.48-46.08-10.24-81.92-30.72-107.52-51.2-5.12-5.12-20.48-15.36-25.6-25.6-10.24-5.12-20.48-20.48-20.48-25.6-15.36-25.6-35.84-61.44-46.08-112.64-15.36-66.56-15.36-133.12-15.36-168.96 0-35.84 0-97.28 15.36-168.96 10.24-51.2 25.6-87.04 46.08-112.64 0-5.12 10.24-20.48 20.48-25.6l25.6-25.6c20.48-20.48 56.32-35.84 107.52-51.2 61.44-15.36 122.88-20.48 153.6-20.48 30.72 0 92.16 0 153.6 20.48 46.08 10.24 81.92 30.72 107.52 51.2 5.12 5.12 20.48 15.36 25.6 25.6 10.24 5.12 20.48 20.48 20.48 25.6 15.36 25.6 35.84 61.44 46.08 112.64 15.36 66.56 15.36 133.12 15.36 168.96 5.12 35.84 0 97.28-15.36 168.96zM1024 512c0-199.68-56.32-317.44-143.36-394.24C778.24 25.6 655.36 0 512 0S245.76 25.6 143.36 117.76C56.32 194.56 0 312.32 0 512c0 199.68 56.32 317.44 143.36 394.24 102.4 92.16 225.28 117.76 368.64 117.76s266.24-25.6 368.64-117.76c87.04-76.8 143.36-194.56 143.36-394.24z" fill="#16A764" p-id="8640"></path><path d="M512 588.8h-35.84L384 450.56v240.64H307.2v-358.4h81.92l128 199.68 128-199.68H716.8v358.4h-76.8V450.56l-92.16 138.24H512z" fill="#16A764" p-id="8641"></path></svg>`;
}
