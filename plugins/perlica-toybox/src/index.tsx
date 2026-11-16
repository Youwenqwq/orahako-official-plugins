import type { ComponentType } from "react"
import { Bike, History, Map as MapIcon, User } from "lucide-react"
import {
  definePlugin,
  PLUGIN_API_VERSION,
  type PluginManifest,
  type PluginPageProps,
} from "@orahako/plugin-sdk"
import { PerlicaPage } from "./page"
import { PerlicaSettingsPage } from "./settings-page"
import { perlicaTranslations } from "./i18n"
import { createPerlicaRuntime, PerlicaRuntimeProvider } from "./runtime"
import {
  PERLICA_PAGE_INDEX,
  PERLICA_PAGE_SETTINGS,
  PERLICA_ROUTE_INDEX,
  PERLICA_ROUTE_SETTINGS,
} from "./constants"
import "./styles/leaflet.css"

export const manifest: PluginManifest = {
  id: "community.perlica-toybox",
  name: "Perlica",
  version: "1.2.0",
  apiVersion: PLUGIN_API_VERSION,
  minAppVersion: "0.16.0",
  kind: "feature",
  providerIndependent: true,
  inject: ["ui", "i18n", "storage", "http", "native"],
  nativeCapabilities: ["native.geolocation@1"],
  entry: "dist/index.js",
  styles: ["dist/index.css"],
  description: "佩黎卡共享单车：地图找车、扫码解锁、骑行中控制、骑行记录与账户信息。",
}

export const definition = definePlugin(async (ctx) => {
  const runtime = await createPerlicaRuntime(ctx)
  ctx.on("dispose", () => runtime.dispose())

  function withRuntime(Page: ComponentType<PluginPageProps>): ComponentType<PluginPageProps> {
    function RuntimePage(props: PluginPageProps) {
      return (
        <PerlicaRuntimeProvider runtime={runtime}>
          <Page {...props} />
        </PerlicaRuntimeProvider>
      )
    }
    return RuntimePage
  }

  ctx.i18n.register(perlicaTranslations)
  ctx.ui.registerPage({
    id: PERLICA_PAGE_INDEX,
    route: PERLICA_ROUTE_INDEX,
    title: "Perlica",
    titleKey: "perlica.title",
    component: withRuntime(PerlicaPage),
    requiresProvider: false,
  })
  ctx.ui.registerPage({
    id: PERLICA_PAGE_SETTINGS,
    route: PERLICA_ROUTE_SETTINGS,
    title: "Perlica Settings",
    titleKey: "perlica.settingsTitle",
    component: withRuntime(PerlicaSettingsPage),
    parent: PERLICA_PAGE_INDEX,
    requiresProvider: false,
  })
  ctx.ui.registerNavigation({
    id: "perlica",
    title: "Perlica",
    titleKey: "perlica.nav",
    page: PERLICA_PAGE_INDEX,
    params: { tab: "map" },
    icon: Bike,
    group: "extras",
  })
  ctx.ui.registerNavigation({
    id: "map",
    title: "Map",
    titleKey: "perlica.tabMap",
    page: PERLICA_PAGE_INDEX,
    params: { tab: "map" },
    icon: MapIcon,
    scope: "plugin",
    order: 0,
  })
  ctx.ui.registerNavigation({
    id: "ride",
    title: "Ride",
    titleKey: "perlica.tabRide",
    page: PERLICA_PAGE_INDEX,
    params: { tab: "ride" },
    icon: Bike,
    scope: "plugin",
    order: 10,
  })
  ctx.ui.registerNavigation({
    id: "history",
    title: "History",
    titleKey: "perlica.tabHistory",
    page: PERLICA_PAGE_INDEX,
    params: { tab: "history" },
    icon: History,
    scope: "plugin",
    order: 20,
  })
  ctx.ui.registerNavigation({
    id: "account",
    title: "Account",
    titleKey: "perlica.tabAccount",
    page: PERLICA_PAGE_INDEX,
    params: { tab: "account" },
    icon: User,
    scope: "plugin",
    order: 30,
  })
})

export default definition
