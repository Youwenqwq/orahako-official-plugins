import "@orahako/academic-sdk"
import { definePlugin, PLUGIN_API_VERSION, type PluginManifest } from "@orahako/sdk"
import type { ProviderRegistryService } from "@orahako/academic-sdk"
import { ZMU_CONFIG } from "./zmu-config"
import { createZMUProvider, type ZMUProviderServices } from "./zmu-provider"

const ZMU_PROVIDER_INJECT = ["providers", "session", "query"] as const

export const manifest: PluginManifest = {
  id: "zmu.provider",
  name: "遵义医科大学教务",
  version: "1.0.0",
  apiVersion: PLUGIN_API_VERSION,
  minAppVersion: "0.16.0",
  kind: "provider",
  categories: ["provider", "school"],
  required: false,
  inject: [...ZMU_PROVIDER_INJECT],
  entry: "dist/index.js",
  description: "遵义医科大学乘方教务 Provider（验证码登录、学籍、课表、成绩与考试）",
}

/** The plugin-scoped host services this provider consumes. */
export interface ZMUPluginContext {
  providers: Pick<ProviderRegistryService, "registerProvider">
  session: ZMUProviderServices["session"]
  query: ZMUProviderServices["query"]
}

export function registerZMUProvider(ctx: ZMUPluginContext): void {
  ctx.providers.registerProvider(
    ZMU_CONFIG.id,
    () => createZMUProvider({ session: ctx.session, query: ctx.query })
  )
}

export const definition = definePlugin({
  manifest,
  inject: ZMU_PROVIDER_INJECT,
  apply(ctx) {
    registerZMUProvider(ctx)
  },
})

export default definition