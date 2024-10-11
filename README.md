***

# 📋 Copy to Markdown

*A Chrome extension that allows users to copy selected text and automatically convert it into well-formatted Markdown.*
<p align="center">
<a href="./README.zh-CN.md">简体中文</a>
</p>

## 🚀 Features

* **Automatic Markdown Conversion**: Instantly transform selected text into Markdown format with a single click.
* **Supports Markdown Syntax**: Handles headers, lists, links, bold/italic text, and more.
* **Easy to Use**: Copy as Markdown without leaving your current page.
* **Flexible**: Works on any website, useful for copying articles, documentation, or code snippets.

## 📥 Installation

1. **Clone the Repository**:

   ```
   bash
   git clone https://github.com/ShetePro/copy-to-markdown.git
   ```

2. **Install Dependencies**:

   ```
   bash
   cd copy-to-markdown
   npm install
   ```

3. **Build the Extension**:

   ```
   bash
   npm run build
   ```

4. **Load the Extension in Chrome**:

   * Navigate to `chrome://extensions/`.
   * Enable **Developer Mode** (toggle switch in the top-right corner).
   * Click on **Load unpacked** and select the `build` folder.


## 🛠 Usage

1. Highlight the text you want to copy.
2. Click the **Transform** icon button that appears below the copied text.
3. The selected text will be converted and copied in Markdown format, ready to paste.

### Example

If you select:

```
Header
This is a paragraph.
- Item 1
- Item 2
```

It will convert to:

```
# Header
This is a paragraph.
- Item 1
- Item 2
```

## 💻 Development

To contribute or make adjustments:

1. Clone the repository.
2. Modify the code as needed.
3. Test it by loading the unpacked extension in Chrome.
4. Submit a pull request with your changes.

## 📝 License

This project is licensed under the MIT License .

## 📧 Support

If you encounter any issues, feel free to [open an issue](https://github.com/ShetePro/copy-to-markdown/issues) or contact us.
