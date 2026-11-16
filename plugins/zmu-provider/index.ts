import {
  PLUGIN_API_VERSION,
  definePlugin,
  type AcademicPluginContext,
  type PluginManifest,
} from "@orahako/plugin-sdk"
import { ZMU_CONFIG } from "./zmu-config"
import { ZMUProvider } from "./zmu-provider"

export const manifest: PluginManifest = {
  id: "zmu.provider",
  name: "遵义医科大学教务",
  version: "1.0.0",
  apiVersion: PLUGIN_API_VERSION,
  minAppVersion: "0.16.0",
  kind: "provider",
  categories: ["provider", "school"],
  required: false,
  inject: ["providers", "session", "query"],
  entry: "index.js",
  description: "遵义医科大学乘方教务 Provider（验证码登录、学籍、课表、成绩与考试）",
}

export const definition = definePlugin((baseCtx) => {
  const ctx = baseCtx as unknown as AcademicPluginContext
  // The registry owns disposal: destroying this Cordis scope revokes the
  // registration together with the factory. The factory captures this plugin's
  // typed context, which is the exact scope the registry reuses for creation.
  ctx.providers.registerProvider(ZMU_CONFIG.id, () => new ZMUProvider(ctx))
})

export default definition
