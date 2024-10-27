import {
  getChromeStorage,
  storageKey,
  watchChromeStorage,
} from "../utils/chromeStorage.js";

let text = "";
let isOpenPopup = false;
const contextMenuId = "CopyToMarkdownContextMenu";

chrome.runtime.onInstalled.addListener(() => {
  getChromeStorage(storageKey).then((res) => {
    res.contextMenus && setContextMenus(res.contextMenus);
  });
});
/*
* Establish a long connection to monitor the closing of the popup
* Because when sendingMessage in the background, if the popup is not opened, an error will be reported
* Error: Could not establish connection. Receiving end does not exist
* */
chrome.runtime.onConnect.addListener((externalPort) => {
  externalPort.onDisconnect.addListener(() => {
    isOpenPopup = false;
    console.log("onDisconnect");
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("传递消息", request);
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
watchChromeStorage((changes) => {
  const { newValue, oldValue } = changes;
  if (newValue.contextMenus !== oldValue.contextMenus) {
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
    if (!!tab.id) {
      chrome.tabs.sendMessage(tab.id, "transformToMarkdown");
    }
  }
});
