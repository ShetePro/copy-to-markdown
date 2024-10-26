import { getChromeStorage, storageKey } from "../utils/chromeStorage.js";

let text = "";
let isOpenPopup = false;
const contextMenuId = "CopyToMarkdownContextMenu";
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.tab) {
    text = request.message;
    isOpenPopup && chrome.runtime.sendMessage(text);
  } else {
    switch (request) {
      case "getClipboardEditor":
        sendResponse(text);
        isOpenPopup = true;
        return;
    }
  }
});
getChromeStorage(storageKey).then((res) => {
  res.contextMenus && setContextMenus(res.contextMenus);
});
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[storageKey]) {
    const { newValue } = changes[storageKey];
    setContextMenus(newValue?.contextMenus);
  }
});

function setContextMenus(show) {
  if (show) {
    // create copyToMarkdown option in contextMenu
    chrome.contextMenus.create(
      {
        contexts: ["selection"],
        id: contextMenuId,
        title: "transform to markdown",
      },
      () => {
        console.log("click contextMenu");
      },
    );
  } else {
    chrome.contextMenus.remove(contextMenuId);
  }
}
// watch contextMenu click event
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === contextMenuId) {
    // send message on content
    chrome.tabs.sendMessage(tab.id, "transformToMarkdown");
  }
});
