import { useEffect } from "react"
import { useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { createStore, type StoreApi } from "zustand/vanilla"
import type { PluginHttpService, PluginKeyValueStorage } from "@orahako/plugin-sdk"
import { SkbirdClient, generateDeviceId } from "./client"

/**
 * Package-owned secure-storage key. The host namespaces every plugin key, so
 * this value only needs to identify the bucket inside 森空鸟's own scope.
 */
export const SKBIRD_STORAGE_KEY = "orahako-skbird"

/**
 * 森空鸟配置。token 来源于 App 抓包（微信登录无法脚本化），过期后需手动更新。
 * deviceId 首次启动随机生成并持久化（与 App 格式一致）。与教务 auth store 完全独立。
 */
export interface SkbirdState {
  token: string
  deviceId: string
  /** 校区别名（多租户），默认 ysu */
  alias: string
  hasHydrated: boolean
  unreadCount: number
  setConfig: (config: { token: string; deviceId: string; alias: string }) => void
  setHasHydrated: (v: boolean) => void
  setUnreadCount: (count: number) => void
}

/** Services injected by plugin initialization; no host module is read here. */
export interface SkbirdStoreDeps {
  http: PluginHttpService
  storage: PluginKeyValueStorage
}

let store: StoreApi<SkbirdState> | null = null
let http: PluginHttpService | null = null
let storage: PluginKeyValueStorage | null = null
let unreadRequest: Promise<void> | undefined

/**
 * Creates the credential store during plugin initialization. The plugin can be
 * restarted with a fresh storage facade, in which case the store is rebuilt.
 */
export function initSkbirdStore(deps: SkbirdStoreDeps): StoreApi<SkbirdState> {
  http = deps.http
  if (store && storage === deps.storage) return store

  unreadRequest = undefined
  let storeRef: StoreApi<SkbirdState> | null = null
  let hydrationFailed = false
  const instance = createStore<SkbirdState>()(
    persist(
      (set) => ({
        token: "",
        deviceId: generateDeviceId(),
        alias: "ysu",
        hasHydrated: false,
        unreadCount: 0,
        setConfig: ({ token, deviceId, alias }) =>
          set({
            token: token.trim(),
            deviceId: deviceId.trim() || generateDeviceId(),
            alias: alias.trim() || "ysu",
            unreadCount: 0,
          }),
        setHasHydrated: (v) => set({ hasHydrated: v }),
        setUnreadCount: (unreadCount) => set({ unreadCount }),
      }),
      {
        name: SKBIRD_STORAGE_KEY,
        storage: createJSONStorage(() => deps.storage),
        partialize: (s) => ({
          token: s.token,
          deviceId: s.deviceId,
          alias: s.alias,
        }),
        onRehydrateStorage: () => (state, error) => {
          if (state) state.setHasHydrated(true)
          else if (error) {
            hydrationFailed = true
            storeRef?.setState({ hasHydrated: true })
          }
        },
      }
    )
  )
  storeRef = instance
  if (hydrationFailed) instance.setState({ hasHydrated: true })
  storage = deps.storage
  store = instance
  return instance
}

export function getSkbirdStore(): StoreApi<SkbirdState> {
  if (!store) {
    throw new Error("Skbird store is not initialized; call initSkbirdStore during plugin setup")
  }
  return store
}

/** React binding for the plugin-initialized store. */
export function useSkbirdStore<T>(selector: (state: SkbirdState) => T): T {
  return useStore(getSkbirdStore(), selector)
}

/** 按当前配置构造客户端；未配置 token 时返回 null */
export function getSkbirdClient(): SkbirdClient | null {
  if (!http) return null
  const { token, deviceId, alias } = getSkbirdStore().getState()
  if (!token) return null
  return new SkbirdClient(http, { token, deviceId, alias })
}

function refreshUnread() {
  if (unreadRequest) return unreadRequest
  const config = getSkbirdStore().getState()
  const client = getSkbirdClient()
  if (!client) {
    config.setUnreadCount(0)
    return Promise.resolve()
  }
  const request = client
    .unreadNum()
    .then((unread) => {
      const current = getSkbirdStore().getState()
      if (
        current.token === config.token &&
        current.deviceId === config.deviceId &&
        current.alias === config.alias
      ) {
        current.setUnreadCount(unread.count + unread.imCount)
      }
    })
    .catch(() => {})
  unreadRequest = request
  void request.finally(() => {
    if (unreadRequest === request) unreadRequest = undefined
  })
  return request
}

/** Share one unread snapshot between page actions and the mobile navigation badge. */
export function useSkbirdUnreadCount(): number {
  const token = useSkbirdStore((state) => state.token)
  const deviceId = useSkbirdStore((state) => state.deviceId)
  const alias = useSkbirdStore((state) => state.alias)
  const hasHydrated = useSkbirdStore((state) => state.hasHydrated)
  useEffect(() => {
    if (hasHydrated) void refreshUnread()
  }, [alias, deviceId, hasHydrated, token])
  return useSkbirdStore((state) => state.unreadCount)
}
