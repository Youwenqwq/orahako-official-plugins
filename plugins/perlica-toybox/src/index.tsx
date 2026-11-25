import { Bike, History, Map as MapIcon, Settings, User } from "lucide-react"
import {
  createObservableSource,
  definePlugin,
  PLUGIN_API_VERSION,
  type PluginManifest,
} from "@orahako/sdk"
import { PerlicaHeaderActions, type PerlicaHeaderActionsInject } from "./header-actions"
import { PerlicaPage, type PerlicaPageInject } from "./page"
import { PerlicaSettingsPanel, type PerlicaSettingsInject } from "./settings-panel"
import { perlicaDictionary } from "./i18n"
import { createPerlicaRuntime } from "./runtime"
import {
  PERLICA_PAGE_INDEX,
  PERLICA_PLUGIN_ID,
  PERLICA_ROUTE_INDEX,
  PERLICA_SETTINGS_ID,
} from "./constants"
import type { PerlicaTab } from "./extras/app-nav"
import "./styles/leaflet.css"

export const manifest: PluginManifest = {
  id: PERLICA_PLUGIN_ID,
  name: "Perlica",
  version: "1.0.1",
  apiVersion: PLUGIN_API_VERSION,
  minAppVersion: "0.16.0",
  kind: "feature",
  providerIndependent: true,
  inject: ["ui", "slots", "settings", "router", "i18n", "storage", "http", "native"],
  nativeCapabilities: ["native.geolocation@1"],
  entry: "dist/index.js",
  styles: ["dist/index.css"],
  description: "佩黎卡共享单车：地图找车、扫码解锁、骑行中控制、骑行记录与账户信息。",
}

export const perlicaPlugin = definePlugin({
  manifest,
  inject: [
    "ui",
    "slots",
    "settings",
    "router",
    "i18n",
    "storage",
    "http",
    "native",
  ] as const,
  apply(ctx) {
    const { ui, slots, settings, router, i18n, storage, http, native } = ctx
    i18n.register(perlicaDictionary)

    const runtime = createPerlicaRuntime({ http, native, storage })
    ctx.effect(() => () => runtime.dispose())
    const refreshRequests = createObservableSource(0)
    const refreshing = createObservableSource(false)

    const requestRefresh = () => {
      refreshRequests.set((value) => value + 1)
    }
    const openSettings = () => {
      router.push({ route: "settings" })
    }
    const openPerlica = () => {
      router.push({
        pluginId: PERLICA_PLUGIN_ID,
        pageId: PERLICA_PAGE_INDEX,
        params: { tab: "map" },
      })
    }
    const navigate = (tab: PerlicaTab) => {
      router.push({
        pluginId: PERLICA_PLUGIN_ID,
        pageId: PERLICA_PAGE_INDEX,
        params: { tab },
      })
    }

    slots.inject("shell.header.actions", (slotCtx) =>
      slotCtx.slots.register(
        {
          id: "perlica-header-actions",
          slot: "shell.header.actions",
          dictionary: perlicaDictionary,
          inject: (): PerlicaHeaderActionsInject => ({
            hooks: {
              location: router.current,
              refreshing,
            },
            pluginId: PERLICA_PLUGIN_ID,
            requestRefresh,
            openSettings,
          }),
        },
        PerlicaHeaderActions
      )
    )

    ui.registerPage(
      {
        id: PERLICA_PAGE_INDEX,
        route: PERLICA_ROUTE_INDEX,
        title: "Perlica",
        titleKey: "perlica.title",
        dictionary: perlicaDictionary,
        store: runtime.store,
        requiresProvider: false,
        inject: (): PerlicaPageInject => ({
          hooks: {
            location: router.current,
            hydrated: runtime.store.hydrated,
            refreshRequests,
            refreshing,
          },
          navigate,
          openSettings,
          setRefreshing: (value) => refreshing.set(value),
          createClient: runtime.createClient,
          readSnapshot: runtime.cache.read,
          writeSnapshot: runtime.cache.write,
          locate: runtime.locate,
        }),
      },
      PerlicaPage
    )

    settings.registerCategory(
      {
        id: PERLICA_SETTINGS_ID,
        title: "Perlica Settings",
        titleKey: "perlica.settingsTitle",
        description: "Perlica account credentials and local debug data.",
        descriptionKey: "perlica.settingsDescription",
        icon: Settings,
        order: 80,
        dictionary: perlicaDictionary,
        store: runtime.store,
        inject: (): PerlicaSettingsInject => ({
          hooks: {
            hydrated: runtime.store.hydrated,
          },
          createClient: runtime.createClient,
          readSnapshot: runtime.cache.read,
          clearSnapshot: runtime.cache.clear,
          openPerlica,
        }),
      },
      PerlicaSettingsPanel
    )

    ui.registerNavigation({
      id: "perlica",
      title: "Perlica",
      titleKey: "perlica.nav",
      page: PERLICA_PAGE_INDEX,
      params: { tab: "map" },
      icon: Bike,
      group: "extras",
    })
    ui.registerNavigation({
      id: "map",
      title: "Map",
      titleKey: "perlica.tabMap",
      page: PERLICA_PAGE_INDEX,
      params: { tab: "map" },
      icon: MapIcon,
      scope: "plugin",
      order: 0,
    })
    ui.registerNavigation({
      id: "ride",
      title: "Ride",
      titleKey: "perlica.tabRide",
      page: PERLICA_PAGE_INDEX,
      params: { tab: "ride" },
      icon: Bike,
      scope: "plugin",
      order: 10,
    })
    ui.registerNavigation({
      id: "history",
      title: "History",
      titleKey: "perlica.tabHistory",
      page: PERLICA_PAGE_INDEX,
      params: { tab: "history" },
      icon: History,
      scope: "plugin",
      order: 20,
    })
    ui.registerNavigation({
      id: "account",
      title: "Account",
      titleKey: "perlica.tabAccount",
      page: PERLICA_PAGE_INDEX,
      params: { tab: "account" },
      icon: User,
      scope: "plugin",
      order: 30,
    })
  },
})

export default perlicaPlugin
