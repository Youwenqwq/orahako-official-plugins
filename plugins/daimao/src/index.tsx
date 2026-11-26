import { Cat } from "lucide-react"
import { definePlugin, validatePluginManifest } from "@orahako/sdk"
import manifest from "../manifest.json"
import { daimaoDictionary } from "./i18n"
import { DaimaoOverlay, type DaimaoOverlayInject } from "./overlay"
import type { DaimaoAssetUrls } from "./renderer"
import { DaimaoSettings } from "./settings"
import { daimaoStore } from "./store"

declare module "@orahako/sdk" {
  interface SlotMap {
    "shell.overlay": { kind: "list"; owner: Record<string, never> }
  }
}

export const DAIMAO_PLUGIN_ID = "orahako.daimao"

export default definePlugin({
  manifest: validatePluginManifest(manifest),
  inject: ["slots", "settings", "i18n", "storage", "assets"] as const,
  apply(ctx) {
    const storeInstance = daimaoStore.create(ctx.storage)
    ctx.effect(() => () => storeInstance.dispose())

    ctx.i18n.register({
      zh: {
        settings: daimaoDictionary.zh.settings,
        daimao: daimaoDictionary.zh,
      },
      en: {
        settings: daimaoDictionary.en.settings,
        daimao: daimaoDictionary.en,
      },
    })

    const resolveAssets = (): DaimaoAssetUrls | null => {
      const moc3 = ctx.assets.url("assets/daimao.moc3")
      const texture = ctx.assets.url("assets/texture_00.webp")
      if (!moc3 || !texture) return null
      return {
        moc3,
        texture,
        physics: ctx.assets.url("assets/physics3.json"),
      }
    }

    ctx.settings.registerCategory(
      {
        id: "daimao",
        order: 65,
        title: "呆猫桌宠",
        titleKey: "settings.title",
        description: "在页面全局展示怪物猎人呆猫 Live2D 模型，支持互动与缩放",
        descriptionKey: "settings.description",
        icon: Cat,
        dictionary: daimaoDictionary,
        store: storeInstance,
      },
      DaimaoSettings
    )

    ctx.slots.inject("shell.overlay", () =>
      ctx.slots.register(
        {
          id: "daimao-live2d",
          slot: "shell.overlay",
          order: 30,
          dictionary: daimaoDictionary,
          store: storeInstance,
          inject: (): DaimaoOverlayInject => ({
            assets: resolveAssets(),
          }),
        },
        DaimaoOverlay
      )
    )
  },
})
