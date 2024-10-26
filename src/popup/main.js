import { openSettingRender } from "./render/settingRender.js";
import { defaultStorage, getChromeStorage } from "../utils/chromeStorage.js";
import { clipboardEditorRender } from "./render/copyRender.js";

const popupContent = () => {
  const app = document.getElementById("app");
  const header = document.createElement("header");
  const state = defaultStorage || getChromeStorage();
  header.innerHTML = `<h2>Copy To Markdown</h2>`;
  header.classList.add("app-header");
  const openSettings = openSettingRender(state);
  const copyEditor = clipboardEditorRender();
  app.append(header, openSettings, copyEditor);
  document.body.appendChild(app);
};

popupContent();
