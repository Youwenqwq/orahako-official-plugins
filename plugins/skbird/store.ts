import { defineStore, type StoreActionContext, type StoreInstance } from "@orahako/sdk"
import { generateDeviceId, type SkbirdConfig } from "./client"

/**
 * Package-owned secure-storage key. The host namespaces every plugin key, so
 * this value only needs to identify the bucket inside 森空鸟's own scope.
 */
export const SKBIRD_STORAGE_KEY = "orahako-skbird"

/**
 * 森空鸟配置。token 来源于 App 抓包（微信登录无法脚本化），过期后需手动更新。
 * deviceId 首次启动随机生成并持久化（与 App 格式一致）。与教务 auth store 完全独立。
 *
 * Unread counts are runtime state owned by the plugin rather than persisted
 * configuration; keeping them out of this store also keeps the storage
 * envelope limited to credentials.
 */
export type SkbirdConfigStoreInstance = StoreInstance<
  SkbirdConfig,
  {
    setConfig(ctx: StoreActionContext<SkbirdConfig>, config: SkbirdConfig): void
  }
>

export const skbirdConfigStore = defineStore({
  init: (): SkbirdConfig => ({
    token: "",
    deviceId: generateDeviceId(),
    alias: "ysu",
  }),
  persist: { key: SKBIRD_STORAGE_KEY, mode: "secure" },
  actions: {
    setConfig({ set }, config: SkbirdConfig) {
      set({
        token: config.token.trim(),
        deviceId: config.deviceId.trim() || generateDeviceId(),
        alias: config.alias.trim() || "ysu",
      })
    },
  },
})
