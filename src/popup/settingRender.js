import { setChromeStorage, storageKey } from "../utils/chromeStorage.js";
import settingStore from "./store.js";

export function openSettingRender() {
  const [setting, { changeSetting }] = settingStore();
  console.log(setting);
  const settingItem = createSettingItemDom();
  const label = document.createElement("span");
  label.innerText = "Conversion";
  const checkbox = document.createElement("div");
  checkbox.id = "checklist";
  const modeList = [
    { name: "Popup Open", key: "selectionPopup", id: "01", value: true },
    { name: "ContextMenu Open", key: "contextMenus", id: "02", value: true },
  ];
  modeList.forEach((radio) => {
    const box = document.createElement("div");
    box.classList.add("checkbox-item");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = radio.id;
    input.value = radio.key;
    input.checked = setting[radio.key];
    input.addEventListener("change", openMethodsHandle);
    const label = document.createElement("label");
    label.setAttribute("for", radio.id);
    label.innerText = radio.name;
    box.append(input, label);
    checkbox.appendChild(box);
  });
  settingItem.append(label, checkbox);
  function openMethodsHandle(e) {
    const { value, checked } = e.target;
    changeSetting({
      [value]: checked,
    });
    console.log(value, checked);
    console.log(setting);
  }

  function setConfig() {}

  return settingItem;
}

function createSettingItemDom() {
  const settingItem = document.createElement("div");
  settingItem.classList.add("setting-item");
  return settingItem;
}