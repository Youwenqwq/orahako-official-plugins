import { KeyRound, Zap } from "lucide-react"
import {
  createObservableSource,
  definePlugin,
  validatePluginManifest,
} from "@orahako/sdk"
import manifest from "./manifest.json"
import { CampusChargeClient } from "./client"
import { campusChargeDictionary } from "./i18n"
import { ChargeHeaderAction, type ChargeHeaderActionInject } from "./navigation"
import { ChargeIndexPage, type ChargeIndexInject } from "./pages/index"
import { ChargeSettingsPage, type ChargeSettingsInject } from "./pages/settings"
import {
  chargeAuthStore,
  chargeDataStore,
  type ChargeAuthStoreInstance,
  type ChargeDataStoreInstance,
} from "./store"

export const CAMPUS_CHARGE_PLUGIN_ID = "community.campus-charge"

export type {
  ChargeAuthStoreInstance,
  ChargeDataStoreInstance,
  ChargeHeaderActionInject,
  ChargeIndexInject,
  ChargeSettingsInject,
}

export default definePlugin({
  manifest: validatePluginManifest(manifest),
  inject: ["ui", "slots", "router", "i18n", "http", "storage"] as const,
  apply(ctx) {
    const { ui, slots, router, i18n, http, storage } = ctx
    i18n.register(campusChargeDictionary)

    const authStore: ChargeAuthStoreInstance = chargeAuthStore.create(storage)
    const dataStore: ChargeDataStoreInstance = chargeDataStore.create(storage)
    const hasToken = createObservableSource(Boolean(authStore.source.getSnapshot().token))

    const syncTokenState = (): void => {
      hasToken.set(Boolean(authStore.source.getSnapshot().token))
    }
    const unsubscribeAuth = authStore.source.subscribe(syncTokenState)
    const unsubscribeAuthHydrated = authStore.hydrated.subscribe(syncTokenState)
    syncTokenState()

    const getClient = (): CampusChargeClient | null => {
      const token = authStore.source.getSnapshot().token
      return token ? new CampusChargeClient(http, token) : null
    }

    const openPage = (pageId: string): void => {
      router.push({ pluginId: CAMPUS_CHARGE_PLUGIN_ID, pageId })
    }

    ui.registerPage(
      {
        id: "index",
        title: "校园充电",
        titleKey: "charge.title",
        requiresProvider: false,
        dictionary: campusChargeDictionary,
        store: dataStore,
        inject: (): ChargeIndexInject => ({
          hooks: {
            authHydrated: authStore.hydrated,
            dataHydrated: dataStore.hydrated,
            hasToken,
          },
          getClient,
          openSettings: () => openPage("settings"),
        }),
      },
      ChargeIndexPage
    )

    ui.registerPage(
      {
        id: "settings",
        title: "Token 配置与获取引导",
        titleKey: "charge.settingsTitle",
        parent: "index",
        requiresProvider: false,
        dictionary: campusChargeDictionary,
        store: authStore,
        inject: (): ChargeSettingsInject => ({
          hooks: {
            hydrated: authStore.hydrated,
          },
          createClient: (token: string) => new CampusChargeClient(http, token),
          openIndex: () => openPage("index"),
        }),
      },
      ChargeSettingsPage
    )

    ui.registerNavigation({
      id: "campus-charge",
      title: "校园充电",
      titleKey: "charge.nav",
      page: "index",
      icon: Zap,
      group: "extras",
    })

    ui.registerNavigation({
      id: "dashboard",
      title: "校园充电",
      titleKey: "charge.nav",
      page: "index",
      icon: Zap,
      scope: "plugin",
      order: 0,
    })

    ui.registerNavigation({
      id: "settings",
      title: "Token 与引导",
      titleKey: "charge.settingsNav",
      page: "settings",
      icon: KeyRound,
      scope: "plugin",
      order: 10,
    })

    slots.inject("shell.header.actions", (slotCtx) =>
      slotCtx.slots.register(
        {
          id: "campus-charge-header-actions",
          slot: "shell.header.actions",
          dictionary: campusChargeDictionary,
          inject: (): ChargeHeaderActionInject => ({
            hooks: {
              location: router.current,
            },
            pluginId: CAMPUS_CHARGE_PLUGIN_ID,
            openSettings: () => openPage("settings"),
          }),
        },
        ChargeHeaderAction
      )
    )

    ctx.effect(() => () => {
      unsubscribeAuth()
      unsubscribeAuthHydrated()
      authStore.dispose()
      dataStore.dispose()
    })
  },
})
