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
    if (clipMarkdownText) {
      const editor = document.querySelector(".clipboard-editor-input");
      const copyText = editor.value;
      console.log(copyText)
      navigator.clipboard
        .writeText(copyText)
        .then(() => {
          createAlert("Copied!");
        })
        .catch(() => {
          createAlert("Fail!");
        });
    }
  });
  title.append(span, button);
  return title;
}
export function createEditor() {
  const main = document.createElement("div");
  const editor = document.createElement("textarea");
  main.classList.add("box");
  editor.classList.add("clipboard-editor-input");
  editor.addEventListener("input", (e) => {
    clipMarkdownText = e.target;
  });
  // first get copy text
  chrome.runtime.sendMessage("getClipboardEditor", (message) => {
    clipMarkdownText = message || "";
    changeEditorState(main, editor)
  });
  // change message
  chrome.runtime.onMessage.addListener((request) => {
    clipMarkdownText = request || "";
    changeEditorState(main, editor)
  });
  changeEditorState(main, editor)
  main.appendChild(editor);
  return main;
}

function changeEditorState(main, editor) {
  if (clipMarkdownText) {
    editor.remove()
    editor.value = clipMarkdownText;
    main.append(editor)
  } else {
    main.innerHTML = getEditorEmpty()
  }
}

function getEditorEmpty() {
  return `<div class="editor-empty">
      The converted markdown content will be displayed here, you can edit and modify the converted markdown.
  </div>`;
}
