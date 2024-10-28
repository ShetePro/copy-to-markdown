import { createAlert } from "../components/alert/alert.js";

let clipMarkdownText = "";
export function clipboardEditorRender(text) {
  const copyBox = document.createElement("div");
  copyBox.classList.add("setting-item", "clipboard-editor");
  const editor = createEditor();
  const title = createTitle();
  copyBox.append(title, editor);
  return copyBox;
}
function createTitle() {
  const title = document.createElement("div");
  title.classList.add("setting-title");
  const span = document.createElement("span");
  span.innerText = "Clipboard";
  const button = document.createElement("button");
  button.classList.add("title-button");
  button.innerText = "Copied";
  button.addEventListener("click", () => {
    console.log('click')
    const editor = document.querySelector(".clipboard-editor-input");
    const copyText = editor.textContent;
    console.log(copyText);
    createAlert("Copied!");
  });
  title.append(span, button);
  return title;
}
export function createEditor() {
  const editor = document.createElement("div");
  editor.classList.add("clipboard-editor-input");
  // first get copy text
  chrome.runtime.sendMessage("getClipboardEditor", (message) => {
    clipMarkdownText = message || "";
    changeEditorState(editor);
  });
  // change message
  chrome.runtime.onMessage.addListener((request) => {
    clipMarkdownText = request || "";
    changeEditorState(editor);
  });
  changeEditorState(editor);
  return editor;
}

function changeEditorState(editor) {
  if (clipMarkdownText) {
    editor.setAttribute("contenteditable", "true");
    editor.innerText = clipMarkdownText;
  } else {
    editor.innerHTML = getEditorEmpty();
  }
}

function getEditorEmpty() {
  return `<div class="editor-empty">
      The converted markdown content will be displayed here, you can edit and modify the converted markdown.
  </div>`;
}
