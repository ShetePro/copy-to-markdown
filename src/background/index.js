console.log("Background background");
let text = "";
let isOpenPopup = false;
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
