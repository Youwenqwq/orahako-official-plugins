import { definePlugin, PLUGIN_API_VERSION, type PluginManifest } from "@orahako/sdk"
import { arknightsThemeCss } from "./styles"

export const manifest: PluginManifest = {
  id: "community.theme.arknights",
  name: "明日方舟 × 新粗野主义",
  version: "1.0.1",
  apiVersion: PLUGIN_API_VERSION,
  minAppVersion: "0.16.0",
  kind: "theme",
  inject: ["ui"],
  entry: "dist/index.js",
  description: "罗德岛终端视觉体系：石墨画布、2px 墨边、零圆角、硬偏移阴影、工程网格与青色信号。",
  author: "heshuoshuo0512 / Orahako",
}

export const definition = definePlugin({
  manifest,
  inject: ["ui"] as const,
  apply(ctx) {
    ctx.ui.registerTheme({
      id: "arknights",
      name: "明日方舟 × 新粗野主义",
      css: arknightsThemeCss,
    })
  },
})

export default definition
