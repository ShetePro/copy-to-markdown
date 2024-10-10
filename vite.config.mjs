import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
export default defineConfig({
  root: ".",
  plugins: [crx({ manifest })],
  css: {
    modules: {
      scopeBehaviour: 'local', // 使 CSS 类名模块化
      globalModulePaths: [/global/],  // 指定哪些文件不应用模块化
    },
  },
});
