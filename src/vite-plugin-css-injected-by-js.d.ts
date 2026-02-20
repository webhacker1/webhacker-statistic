declare module "vite-plugin-css-injected-by-js" {
  import type { PluginOption } from "vite";
  export default function cssInjectedByJsPlugin(options?: Record<string, unknown>): PluginOption;
}
