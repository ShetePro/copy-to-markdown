export const storageKey = 'CopyToMarkdown'
export const defaultStorage = {
  selectionPopup: true,
  contextMenus: true,
  shortcut: '',
  popupOpacity: 1,
}
export function setChromeStorage(key = storageKey, value) {
  chrome?.storage?.local.set({ [key]: value }).then(() => {
    console.log("Value is set", arguments);
  });
}

export function getChromeStorage(key = storageKey) {
  return new Promise((resolve) => {
    chrome?.storage?.local.get([key]).then((result) => {
      console.log("Value is ", result);
      resolve(result[key] || defaultStorage);
    });
  });
}

export function watchChromeStorage(callback) {
  chrome.storage.local.onChanged.addListener(callback);
}
