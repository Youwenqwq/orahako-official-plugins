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
import { ios6Dictionary } from "./dictionary"
import { Ios6Shell, ios6ShellChildren, type Ios6ShellInject } from "./ios6-shell"
import {
  resolveIos6IconKind,
  type SpringBoardAppEntry,
  type SpringBoardSettingsEntry,
} from "./springboard"
import { ios6Store } from "./store"

export { ios6Dictionary, ios6Store, Ios6Shell }
export * from "./springboard"
export * from "./ios6-icons"
export * from "./ios6-styles"
export * from "./ios6-status-bar"
export * from "./ios6-lock-screen"
export * from "./ios6-settings"
export * from "./ios6-spotlight"

export const IOS6_SHELL_PLUGIN_ID = "orahako.shell.ios6"
export const IOS6_SHELL_ID = "ios6"
export const IOS6_SHELL_QUALIFIED_ID = `${IOS6_SHELL_PLUGIN_ID}:${IOS6_SHELL_ID}`

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

export const ios6ShellPlugin = definePlugin({
  manifest: validatePluginManifest(manifest),
  inject: ["ui", "slots", "router", "navigation", "i18n", "storage"] as const,
  optionalInject: ["http", "settings"] as const,
  apply(ctx) {
    // Ensure shared shell slots exist when running without the default shell
    for (const [name, spec] of Object.entries(ios6ShellChildren)) {
      const existing = ctx.slots
        .getSnapshot()
        .declarations.some((decl) => decl.name === name)
      if (!existing) {
        ctx.slots.declare({ name: name as SlotName, kind: spec.kind })
      }
    }

    const store = ios6Store.create(ctx.storage)
    ctx.effect(() => () => {
      store.dispose()
    })

    const groupLabelFor = (group: string): string => {
      const translateLocal = ctx.i18n.translator(ios6Dictionary)
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

    const resolveSpringBoardApps = (
      uiSnapshot: PluginUIServiceSnapshot,
      locale: PluginLocale
    ): readonly SpringBoardAppEntry[] => {
      const appNav = ctx.navigation.forScope<AppNavContribution>("app")
      const result: SpringBoardAppEntry[] = []
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
          kind: "plugin-page",
          pluginId: page.pluginId,
          pageId: page.id,
          title,
          group,
          groupLabel: groupLabelFor(group),
          icon: resolveIos6IconKind({
            pluginId: page.pluginId,
            id: page.id,
            title,
            icon: typeof item.icon === "string" ? item.icon : undefined,
            group,
          }),
          primary: Boolean(item.primary || page.primary),
          badgeComponent: item.badge,
        })
      }

      return result
    }

    const resolveSettingsEntries = (
      categories: readonly PluginSettingsCategory[],
      uiSnapshot: PluginUIServiceSnapshot,
      locale: PluginLocale
    ): readonly SpringBoardSettingsEntry[] => {
      const translateLocal = ctx.i18n.translator(ios6Dictionary)
      const list: SpringBoardSettingsEntry[] = []

      const settingsPage = uiSnapshot.pages.find(
        (page) =>
          page.route === "settings" ||
          (page.pluginId === "orahako.settings" && page.id === "settings")
      )
      if (settingsPage) {
        list.push({
          id: "system-settings",
          kind: "system-settings",
          pluginId: settingsPage.pluginId,
          title: translateLocal("shell.openSystemSettings"),
          description: translateLocal("shell.openSystemSettingsDesc"),
          icon: "settings",
        })
      }

      for (const cat of categories) {
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
        list.push({
          id: `cat:${cat.id}`,
          kind: "category",
          categoryId: cat.id,
          pluginId: cat.pluginId,
          title,
          description: description || undefined,
          icon: resolveIos6IconKind({
            pluginId: cat.pluginId,
            id: cat.id,
            title,
            icon: typeof cat.icon === "string" ? cat.icon : undefined,
          }),
        })
      }

      return list
    }

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
        id: IOS6_SHELL_ID,
        name: "iOS 6 桌面",
        dictionary: ios6Dictionary,
        children: ios6ShellChildren,
        declareChildren: false,
        store,
        inject: (): Ios6ShellInject => ({
          hooks: {
            ui: ctx.ui.state,
            location: ctx.router.current,
            navRevision: ctx.navigation.state,
            httpActivity: ctx.http?.activity ?? STATIC_HTTP_ACTIVITY_SOURCE,
            settingsCategories: ctx.settings?.state ?? STATIC_SETTINGS_CATEGORIES_SOURCE,
          },
          resolveSpringBoardApps,
          resolveSettingsEntries,
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
      Ios6Shell
    )
  },
})

export default ios6ShellPlugin
