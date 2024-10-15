***

# 📋 复制到 Markdown

*一个 Chrome 扩展，用于复制选定文本并将其转换为格式良好的 Markdown。*
<p align="center">
<a href="./README.md">English</a>
</p>

## 🚀 功能

* **自动 Markdown 转换**：通过一次点击瞬间将选定文本转换为 Markdown 格式。
* **支持 Markdown 语法**：处理标题、列表、链接、粗体/斜体文本等。
* **易于使用**：在不离开当前页面的情况下复制为 Markdown。
* **灵活性**：适用于任何网站，方便复制文章、文档或代码片段。

## 📥 安装
>你可以在 chrome web store 下载 [Copy to Markdown](https://chromewebstore.google.com/detail/copy-to-markdown/fflojeofcghhceclfeialkpdajephlnl) 插件 。

或者本地安装
* **克隆仓库**：

  ```
  bash
  git clone https://github.com/ShetePro/copy-to-markdown.git
  ```

* **安装依赖**：

  ```
  bash
  cd copy-to-markdown
  npm install
  ```

* **打包扩展**：

  ```
  bash
  npm run build
  ```

* **在 Chrome 中加载扩展**：

    * 转到 `chrome://extensions/`。
    * 启用 **开发者模式**（右上角的切换开关）。
    * 点击 **加载已解压的扩展**，选择 `dist` 文件夹。

## 🛠 用法

1. 高亮选择要复制的文本。
2. 点击复制文本下方出现的 **Transform** 图标按钮。
3. 选定文本将被转换并以 Markdown 格式复制，准备粘贴。

### 示例

如果你选择：

```
diff
Copy code
标题
这是一个段落。
- 项目 1
- 项目 2
```

它将转换为：

```
markdown
Copy code
# 标题
这是一个段落。
- 项目 1
- 项目 2
```

## 💻 开发

如需贡献或进行调整：

1. 克隆仓库。
2. 根据需要修改代码。
3. 在 Chrome 中加载已解压的扩展进行测试。
4. 提交包含更改的拉取请求。

## 📝 许可证

该项目根据 MIT 许可证开源 - 详细信息见 [LICENSE]() 文件。

## 📧 支持

如果遇到任何问题，请随时 [提交问题](https://github.com/ShetePro/copy-to-markdown/issues) 或与我们联系。
