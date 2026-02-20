import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: "src/widget.ts",
      name: "WebHackerStatistics",
      formats: ["iife"],
      fileName: () => "webhacker-statistic.bundle.js"
    }
  }
});
