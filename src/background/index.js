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
// watch contextMenu click event
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === contextMenuId) {
    // send message on content
    chrome.tabs.sendMessage(tab.id, "transformToMarkdown");
  }
});
