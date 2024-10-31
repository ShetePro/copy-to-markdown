import { openSettingRender } from "./render/settingRender.js";
import { getChromeStorage } from "../utils/chromeStorage.js";
import { clipboardEditorRender } from "./render/copyRender.js";
import settingStore from "./store.js";
const [setting, { changeSetting }] = settingStore();
// create connect
export const chromeConnect = chrome.runtime.connect();

getChromeStorage().then((res) => {
  changeSetting(res);
  popupContent();
});
const popupContent = () => {
  const app = document.getElementById("app");
  const header = document.createElement("header");
  header.innerHTML = `<h2>Copy To Markdown</h2>`;
  header.classList.add("app-header");
  const openSettings = openSettingRender();
  const copyEditor = clipboardEditorRender();
  app.append(header, openSettings, copyEditor);
  document.body.appendChild(app);
};

