import {
  definePlugin,
  pluginPageHref,
  resolveContributionText,
  validatePluginManifest,
  type NetworkActivitySnapshot,
  type ObservableSource,
  type PluginAppNavigationDefinition,
  type PluginLocale,
  type PluginNavigationContribution,
  type PluginPageContribution,
  type PluginSettingsCategory,
  type PluginUIServiceSnapshot,
  type RouteLocation,
  type SlotName,
} from "@orahako/sdk"
import manifest from "../manifest.json"
import type { ControlPanelItem, DesktopAppEntry } from "./desktop-apps"
import { win98Dictionary } from "./dictionary"
import { win98Store } from "./store"
import { resolveWin98IconKind, WIN98_ICON_KINDS, type Win98IconUrlMap } from "./win98-icons"
import { Win98Shell, win98ShellChildren, type Win98ShellInject } from "./win98-shell"

export { win98Dictionary, win98Store, Win98Shell }
export * from "./window-manager"
export * from "./win98-styles"
export * from "./win98-icons"

export const WIN98_SHELL_PLUGIN_ID = "orahako.shell.win98"
export const WIN98_SHELL_ID = "win98"
export const WIN98_SHELL_QUALIFIED_ID = `${WIN98_SHELL_PLUGIN_ID}:${WIN98_SHELL_ID}`

type AppNavContribution = PluginNavigationContribution & PluginAppNavigationDefinition

const EMPTY_HTTP_ACTIVITY: NetworkActivitySnapshot = {
  active: [],
  history: [],
  session: null,
  revision: 0,
}

const STATIC_HTTP_ACTIVITY_SOURCE: ObservableSource<NetworkActivitySnapshot> = {
  getSnapshot: () => EMPTY_HTTP_ACTIVITY,
  subscribe: () => () => {},
}

const EMPTY_SETTINGS_CATEGORIES: readonly PluginSettingsCategory[] = []

const STATIC_SETTINGS_CATEGORIES_SOURCE: ObservableSource<readonly PluginSettingsCategory[]> = {
  getSnapshot: () => EMPTY_SETTINGS_CATEGORIES,
  subscribe: () => () => {},
}

export const win98ShellPlugin = definePlugin({
  manifest: validatePluginManifest(manifest),
  inject: ["ui", "slots", "router", "navigation", "i18n", "storage", "assets"] as const,
  optionalInject: ["http", "settings"] as const,
  apply(ctx) {
    const iconUrls: Partial<Record<(typeof WIN98_ICON_KINDS)[number], string>> = {}
    for (const kind of WIN98_ICON_KINDS) {
      const url = ctx.assets.url(`assets/icons/${kind}.png`)
      if (url) {
        iconUrls[kind] = url
      }
    }
    const resolvedIconUrls: Win98IconUrlMap = iconUrls
    // Ensure shared shell slots exist when running without the default shell
    for (const [name, spec] of Object.entries(win98ShellChildren)) {
      const existing = ctx.slots
        .getSnapshot()
        .declarations.some((decl) => decl.name === name)
      if (!existing) {
        ctx.slots.declare({ name: name as SlotName, kind: spec.kind })
      }
    }

    const store = win98Store.create(ctx.storage)
    ctx.effect(() => () => {
      store.dispose()
    })

    const groupLabelFor = (group: string): string => {
      const translateLocal = ctx.i18n.translator(win98Dictionary)
      switch (group) {
        case "main":
          return translateLocal("shell.groupMain")
        case "academic":
          return translateLocal("shell.groupAcademic")
        case "platform":
          return translateLocal("shell.groupPlatform")
        case "fees":
          return translateLocal("shell.groupFees")
        case "extras":
          return translateLocal("shell.groupExtras")
        case "plugins":
          return translateLocal("shell.groupPlugins")
        case "account":
          return translateLocal("shell.groupAccount")
        default:
          return translateLocal("shell.groupOther")
      }
    }

    const resolvePageTitle = (page: PluginPageContribution, locale: PluginLocale): string =>
      resolveContributionText({
        dictionary: page.dictionary,
        key: page.titleKey,
        literal: page.title ?? page.id,
        locale,
        pluginId: page.pluginId,
        i18n: ctx.i18n,
      })

    const resolveDesktopApps = (
      uiSnapshot: PluginUIServiceSnapshot,
      locale: PluginLocale
    ): readonly DesktopAppEntry[] => {
      const appNav = ctx.navigation.forScope<AppNavContribution>("app")
      const result: DesktopAppEntry[] = []
      const seenPages = new Set<string>()

      for (const item of appNav) {
        const page = uiSnapshot.pages.find(
          (candidate) => candidate.pluginId === item.pluginId && candidate.id === item.page
        )
        if (!page) continue
        const pageKey = `${page.pluginId}:${page.id}`
        if (seenPages.has(pageKey)) continue
        seenPages.add(pageKey)

        const title = resolveContributionText({
          dictionary: page.dictionary,
          key: item.titleKey ?? page.titleKey,
          literal: item.title ?? page.title ?? item.id,
          locale,
          pluginId: item.pluginId,
          i18n: ctx.i18n,
        })
        const group = item.group ?? "main"
        result.push({
          key: pageKey,
          pluginId: page.pluginId,
          pageId: page.id,
          title,
          group,
          groupLabel: groupLabelFor(group),
          icon: resolveWin98IconKind({
            pluginId: page.pluginId,
            id: page.id,
            icon: typeof item.icon === "string" ? item.icon : undefined,
            group,
          }),
          primary: Boolean(item.primary || page.primary),
        })
      }

      return result
    }

    const resolveControlPanelCategories = (
      categories: readonly PluginSettingsCategory[],
      locale: PluginLocale
    ): readonly ControlPanelItem[] =>
      categories.map((cat) => {
        const title = resolveContributionText({
          dictionary: cat.dictionary,
          key: cat.titleKey,
          literal: cat.title ?? cat.id,
          locale,
          pluginId: cat.pluginId,
          i18n: ctx.i18n,
        })
        const description = resolveContributionText({
          dictionary: cat.dictionary,
          key: cat.descriptionKey,
          literal: cat.description,
          locale,
          pluginId: cat.pluginId,
          i18n: ctx.i18n,
        })
        return {
          id: `cp:cat:${cat.id}`,
          kind: "category",
          categoryId: cat.id,
          pluginId: cat.pluginId,
          title,
          description: description || undefined,
          icon: resolveWin98IconKind({
            pluginId: cat.pluginId,
            id: cat.id,
            icon: typeof cat.icon === "string" ? cat.icon : undefined,
          }),
        }
      })

    const resolveActivePage = (
      location: RouteLocation,
      uiSnapshot: PluginUIServiceSnapshot
    ): PluginPageContribution | undefined => {
      const lookup = (pluginId: string, pageId: string): PluginPageContribution | undefined =>
        uiSnapshot.pages.find(
          (candidate) => candidate.pluginId === pluginId && candidate.id === pageId
        )

      if (location.route) {
        const target = ctx.navigation.resolve(location.route)
        return target ? lookup(target.pluginId, target.pageId) : undefined
      }
      if (location.pluginId) {
        const pageId = location.pageId ?? "index"
        if (!ctx.navigation.available(location.pluginId, pageId)) return undefined
        return lookup(location.pluginId, pageId)
      }
      const primary = ctx.navigation.primary()
      return primary ? lookup(primary.pluginId, primary.pageId) : undefined
    }

    const syncRoute = (
      pluginId: string,
      pageId: string,
      params?: Readonly<Record<string, string>>
    ): string => {
      const targetHref = pluginPageHref(
        pluginId,
        pageId,
        params && Object.keys(params).length > 0 ? { ...params } : undefined
      )
      const current = ctx.router.current.getSnapshot()
      if (current.href !== targetHref) {
        ctx.router.replace(targetHref)
      }
      return ctx.router.current.getSnapshot().href
    }

    ctx.ui.registerShell(
      {
        id: WIN98_SHELL_ID,
        name: "Windows 98 桌面",
        dictionary: win98Dictionary,
        children: win98ShellChildren,
        declareChildren: false,
        store,
        inject: (): Win98ShellInject => ({
          hooks: {
            ui: ctx.ui.state,
            location: ctx.router.current,
            navRevision: ctx.navigation.state,
            httpActivity: ctx.http?.activity ?? STATIC_HTTP_ACTIVITY_SOURCE,
            settingsCategories: ctx.settings?.state ?? STATIC_SETTINGS_CATEGORIES_SOURCE,
          },
          iconUrls: resolvedIconUrls,
          resolveDesktopApps,
          resolveControlPanelCategories,
          resolveActivePage,
          resolvePageTitle,
          syncRoute,
          registerBackHandler: (onBack, priority) =>
            ctx.router.registerBackGuard(() => {
              onBack()
              return false
            }, priority),
        }),
      },
      Win98Shell
    )
  },
})

export default win98ShellPlugin
