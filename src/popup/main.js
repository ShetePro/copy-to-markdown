import { openSettingRender } from "./settingRender.js";
import {defaultStorage, getChromeStorage} from "../utils/chromeStorage.js";

const popupContent = () => {
  const app = document.getElementById("app");
  const header = document.createElement("header");
  const state = defaultStorage || getChromeStorage();
  header.innerHTML = `<h2>Copy To Markdown</h2>`;
  header.classList.add("app-header");
  const openSettings = openSettingRender(state);
  app.append(header, openSettings);
  document.body.appendChild(app);
};

popupContent();
