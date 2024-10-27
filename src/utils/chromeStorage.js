export const storageKey = "CopyToMarkdown";
export const defaultStorage = {
  selectionPopup: true,
  contextMenus: true,
  shortcut: "",
  popupOpacity: 1,
};
export function setChromeStorage(key = storageKey, value) {
  chrome?.storage?.local.set({ [key]: value }).then(() => {});
}

export function getChromeStorage(key = storageKey) {
  return new Promise((resolve) => {
    chrome?.storage?.local.get([key]).then((result) => {
      resolve(result[key] || defaultStorage);
    });
  });
}

export function watchChromeStorage(callback, options = {}) {
  const { type = "local", key = storageKey } = options;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === type && changes[storageKey]) {
      callback(changes[storageKey]);
    }
  });
}
