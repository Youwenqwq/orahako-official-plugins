import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import type {
  DerivedComponentProps,
  NetworkActivitySnapshot,
  ObservableSource,
  PluginLocale,
  PluginPageContribution,
  PluginSettingsCategory,
  PluginUIServiceSnapshot,
  RouteLocation,
  ShellOwnerProps,
  SlotComponent,
} from "@orahako/sdk"
import { BackLayerProvider, Toaster, type RegisterBackLayer } from "@orahako/ui-primitives"
import "./slots-declare"
import {
  AboutWin98Content,
  ControlPanelContent,
  DisplayPropertiesContent,
  ExplorerWindowContent,
  type ControlPanelItem,
  type DesktopAppEntry,
} from "./desktop-apps"
import type { Win98Dictionary } from "./dictionary"
import type { Win98StoreInstance } from "./store"
import { Win98Taskbar } from "./taskbar"
import {
  resolveWin98IconKind,
  Win98Icon,
  Win98IconAssetsProvider,
  type Win98IconKind,
  type Win98IconUrlMap,
} from "./win98-icons"
import { buildWin98Styles, WIN98_WALLPAPERS } from "./win98-styles"
import {
  cascadeWindows,
  closeWindow,
  focusWindow,
  getTopFocusedWindowId,
  minimizeAllWindows,
  minimizeWindow,
  openOrFocusWindow,
  pluginWindowId,
  TASKBAR_HEIGHT,
  tileWindows,
  toggleMaximizeWindow,
  updateWindowBounds,
  type DesktopWindow,
  type ViewportSize,
} from "./window-manager"
import { spawnWireframeZoom, Win98Window } from "./win98-window"

export const win98ShellChildren = {
  "shell.gate": { kind: "chain" },
  "shell.banner": { kind: "list" },
  "shell.activity": { kind: "list" },
  "shell.header.actions": { kind: "list" },
  "shell.sidebar.footer": { kind: "list" },
  "shell.overlay": { kind: "list" },
  "settings.category.panel": { kind: "keyed" },
} as const

export interface Win98ShellInject {
  readonly hooks: {
    readonly ui: ObservableSource<PluginUIServiceSnapshot>
    readonly location: ObservableSource<RouteLocation>
    readonly navRevision: ObservableSource<number>
    readonly httpActivity: ObservableSource<NetworkActivitySnapshot>
    readonly settingsCategories: ObservableSource<readonly PluginSettingsCategory[]>
  }
  readonly iconUrls: Win98IconUrlMap
  readonly resolveDesktopApps: (
    uiSnapshot: PluginUIServiceSnapshot,
    locale: PluginLocale
  ) => readonly DesktopAppEntry[]
  readonly resolveControlPanelCategories: (
    categories: readonly PluginSettingsCategory[],
    locale: PluginLocale
  ) => readonly ControlPanelItem[]
  readonly resolveActivePage: (
    location: RouteLocation,
    uiSnapshot: PluginUIServiceSnapshot
  ) => PluginPageContribution | undefined
  readonly resolvePageTitle: (page: PluginPageContribution, locale: PluginLocale) => string
  readonly syncRoute: (
    pluginId: string,
    pageId: string,
    params?: Readonly<Record<string, string>>
  ) => string
  readonly registerBackHandler: RegisterBackLayer
}

export type Win98ShellProps = DerivedComponentProps<
  ShellOwnerProps,
  Win98Dictionary,
  typeof win98ShellChildren,
  Win98StoreInstance,
  Win98ShellInject
>

interface ContextMenuState {
  readonly left: number
  readonly top?: number
  readonly bottom?: number
}

interface MarqueeRect {
  readonly startX: number
  readonly startY: number
  readonly currentX: number
  readonly currentY: number
}

type DesktopShortcutItem =
  | {
      readonly id: string
      readonly title: string
      readonly icon: Win98IconKind
      readonly kind: "explorer" | "control-panel" | "display"
    }
  | {
      readonly id: string
      readonly title: string
      readonly icon: Win98IconKind
      readonly kind: "app"
      readonly app: DesktopAppEntry
    }

function readViewport(): ViewportSize {
  if (typeof window === "undefined") return { width: 1280, height: 800 }
  return { width: window.innerWidth, height: window.innerHeight }
}

const EXPLORER_WINDOW_ID = "win98:explorer"
const CONTROL_PANEL_WINDOW_ID = "win98:control-panel"
const DISPLAY_WINDOW_ID = "win98:display"
const ABOUT_WINDOW_ID = "win98:about"

export const Win98Shell: SlotComponent<Win98ShellProps> = (props) => {
  const {
    children,
    selectShell,
    renderPage,
    t,
    locale,
    renderSlot,
    renderSlotChain,
    useStore,
    actions,
    useUi,
    useLocation,
    useNavRevision,
    useHttpActivity,
    useSettingsCategories,
    iconUrls,
    resolveDesktopApps,
    resolveControlPanelCategories,
    resolveActivePage,
    resolvePageTitle,
    syncRoute,
    registerBackHandler,
  } = props

  const uiSnapshot = useUi()
  const location = useLocation()
  const navRevision = useNavRevision()
  const httpActivity = useHttpActivity()
  const settingsCategories = useSettingsCategories()
  void navRevision

  const activeHttpCount = httpActivity.active.length
  const isHttpLoading = activeHttpCount > 0
  const loadingStatusText = useMemo(() => {
    if (activeHttpCount === 0) return t("shell.loading")
    if (activeHttpCount === 1) {
      const label = httpActivity.active[0]?.label?.trim()
      return label ? t("shell.loadingWithLabel", { label }) : t("shell.loading")
    }
    return t("shell.loadingCount", { count: activeHttpCount })
  }, [activeHttpCount, httpActivity.active, t])

  const wallpaper = useStore((s) => s.wallpaper)
  const scheme = useStore((s) => s.scheme)
  const explorerView = useStore((s) => s.explorerView)

  const [viewport, setViewport] = useState<ViewportSize>(readViewport)
  const [windows, setWindows] = useState<DesktopWindow[]>([])
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [marquee, setMarquee] = useState<MarqueeRect | null>(null)

  const lastSyncedHrefRef = useRef<string | null>(null)

  // Apply root attribute so portals & body inherit Win98 styling cleanly, and clean up on unmount
  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.dataset.orahakoShell = "win98"
    return () => {
      if (root.dataset.orahakoShell === "win98") {
        delete root.dataset.orahakoShell
      }
    }
  }, [])

  // Track viewport resize
  useEffect(() => {
    if (typeof window === "undefined") return
    const onResize = () => setViewport(readViewport())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Close menus on Escape
  useEffect(() => {
    if (typeof window === "undefined") return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStartMenuOpen(false)
        setContextMenu(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const apps = useMemo(
    () => resolveDesktopApps(uiSnapshot, locale),
    [resolveDesktopApps, uiSnapshot, locale]
  )

  const activeRoutePage = useMemo(
    () => resolveActivePage(location, uiSnapshot),
    [resolveActivePage, location, uiSnapshot]
  )

  const isFullscreenRoute = Boolean(activeRoutePage?.fullscreen)

  // Synchronize incoming route navigation into the multi-window stack
  useEffect(() => {
    if (!activeRoutePage || activeRoutePage.fullscreen) return
    const hrefKey = location.href
    if (lastSyncedHrefRef.current === hrefKey) return
    lastSyncedHrefRef.current = hrefKey

    const title = resolvePageTitle(activeRoutePage, locale)
    const matchedApp = apps.find(
      (app) => app.pluginId === activeRoutePage.pluginId && app.pageId === activeRoutePage.id
    )
    const icon =
      matchedApp?.icon ??
      resolveWin98IconKind({ pluginId: activeRoutePage.pluginId, id: activeRoutePage.id })

    setWindows((prev) =>
      openOrFocusWindow(
        prev,
        {
          id: pluginWindowId(activeRoutePage.pluginId, activeRoutePage.id),
          kind: "plugin-page",
          pluginId: activeRoutePage.pluginId,
          pageId: activeRoutePage.id,
          routeParams: location.params,
          title,
          icon,
        },
        viewport
      )
    )
  }, [activeRoutePage, apps, locale, location.href, location.params, resolvePageTitle, viewport])

  const openAppWindow = useCallback(
    (app: DesktopAppEntry) => {
      const nextHref = syncRoute(app.pluginId, app.pageId)
      lastSyncedHrefRef.current = nextHref
      setWindows((prev) =>
        openOrFocusWindow(
          prev,
          {
            id: pluginWindowId(app.pluginId, app.pageId),
            kind: "plugin-page",
            pluginId: app.pluginId,
            pageId: app.pageId,
            title: app.title,
            icon: app.icon,
          },
          viewport
        )
      )
    },
    [syncRoute, viewport]
  )

  const openExplorer = useCallback(() => {
    setWindows((prev) =>
      openOrFocusWindow(
        prev,
        {
          id: EXPLORER_WINDOW_ID,
          kind: "explorer",
          title: t("shell.explorer"),
          icon: "computer",
        },
        viewport
      )
    )
  }, [t, viewport])

  const openControlPanel = useCallback(() => {
    setWindows((prev) =>
      openOrFocusWindow(
        prev,
        {
          id: CONTROL_PANEL_WINDOW_ID,
          kind: "control-panel",
          title: t("shell.controlPanel"),
          icon: "settings",
        },
        viewport
      )
    )
  }, [t, viewport])

  const openDisplayProps = useCallback(() => {
    setWindows((prev) =>
      openOrFocusWindow(
        prev,
        {
          id: DISPLAY_WINDOW_ID,
          kind: "display",
          title: t("shell.displayProps"),
          icon: "display",
        },
        viewport
      )
    )
  }, [t, viewport])

  const openAbout = useCallback(() => {
    setWindows((prev) =>
      openOrFocusWindow(
        prev,
        {
          id: ABOUT_WINDOW_ID,
          kind: "about",
          title: t("shell.about"),
          icon: "about",
        },
        viewport
      )
    )
  }, [t, viewport])

  const activeWindowId = useMemo(() => getTopFocusedWindowId(windows), [windows])

  const handleFocusWindow = useCallback(
    (win: DesktopWindow) => {
      setStartMenuOpen(false)
      setContextMenu(null)
      setWindows((prev) => focusWindow(prev, win.id))
      if (win.kind === "plugin-page" && win.pluginId && win.pageId) {
        const nextHref = syncRoute(win.pluginId, win.pageId, win.routeParams)
        lastSyncedHrefRef.current = nextHref
      }
    },
    [syncRoute]
  )

  const handleCloseWindow = useCallback(
    (winId: string) => {
      let nextTopPlugin: DesktopWindow | undefined
      setWindows((prev) => {
        const next = closeWindow(prev, winId)
        const nextTopId = getTopFocusedWindowId(next)
        const nextTop = next.find((candidate) => candidate.id === nextTopId)
        if (nextTop && nextTop.kind === "plugin-page" && nextTop.pluginId && nextTop.pageId) {
          nextTopPlugin = nextTop
        }
        return next
      })
      queueMicrotask(() => {
        if (nextTopPlugin?.pluginId && nextTopPlugin.pageId) {
          const nextHref = syncRoute(
            nextTopPlugin.pluginId,
            nextTopPlugin.pageId,
            nextTopPlugin.routeParams
          )
          lastSyncedHrefRef.current = nextHref
        } else {
          lastSyncedHrefRef.current = null
        }
      })
    },
    [syncRoute]
  )

  const handleMinimizeWindow = useCallback((winId: string, windowRect: DOMRect | null) => {
    if (windowRect && typeof document !== "undefined") {
      const taskBtn = document.querySelector<HTMLElement>(`[data-win98-task-btn="${CSS.escape(winId)}"]`)
      if (taskBtn) {
        spawnWireframeZoom(windowRect, taskBtn.getBoundingClientRect())
      }
    }
    setWindows((prev) => minimizeWindow(prev, winId))
  }, [])

  const handleTaskButtonClick = useCallback(
    (win: DesktopWindow, buttonRect: DOMRect | null) => {
      setStartMenuOpen(false)
      setContextMenu(null)
      if (!win.minimized && activeWindowId === win.id) {
        const winEl =
          typeof document !== "undefined"
            ? document.querySelector<HTMLElement>(`[data-win98-window="${CSS.escape(win.id)}"]`)
            : null
        if (winEl && buttonRect) {
          spawnWireframeZoom(winEl.getBoundingClientRect(), buttonRect)
        }
        setWindows((prev) => minimizeWindow(prev, win.id))
      } else {
        if (win.minimized && buttonRect) {
          const targetRect = win.maximized
            ? new DOMRect(0, 0, viewport.width, viewport.height - TASKBAR_HEIGHT)
            : new DOMRect(win.bounds.x, win.bounds.y, win.bounds.width, win.bounds.height)
          spawnWireframeZoom(buttonRect, targetRect)
        }
        handleFocusWindow(win)
      }
    },
    [activeWindowId, handleFocusWindow, viewport.height, viewport.width]
  )

  const desktopShortcuts = useMemo<readonly DesktopShortcutItem[]>(() => {
    const items: DesktopShortcutItem[] = [
      {
        id: "shortcut:explorer",
        title: t("shell.explorer"),
        icon: "computer",
        kind: "explorer",
      },
    ]

    // Surface primary apps and top navigation shortcuts directly on the desktop
    const primaryApps = apps.filter((app) => app.primary)
    const secondaryApps = apps.filter((app) => !app.primary)
    const featured = [...primaryApps, ...secondaryApps].slice(0, 8)
    for (const app of featured) {
      items.push({
        id: `shortcut:${app.key}`,
        title: app.title,
        icon: app.icon,
        kind: "app",
        app,
      })
    }

    items.push({
      id: "shortcut:control-panel",
      title: t("shell.controlPanel"),
      icon: "settings",
      kind: "control-panel",
    })

    items.push({
      id: "shortcut:display",
      title: t("shell.displayProps"),
      icon: "display",
      kind: "display",
    })

    return items
  }, [apps, t])

  const controlPanelItems = useMemo<readonly ControlPanelItem[]>(() => {
    const builtIn: ControlPanelItem[] = [
      {
        id: "cp:display",
        kind: "display",
        title: t("shell.displayProps"),
        description: t("shell.displayPropsDesc"),
        icon: "display",
      },
    ]

    const settingsPage = uiSnapshot.pages.find(
      (page) => page.route === "settings" || (page.pluginId === "orahako.settings" && page.id === "settings")
    )
    if (settingsPage) {
      builtIn.push({
        id: "cp:system-settings",
        kind: "system-settings",
        pluginId: settingsPage.pluginId,
        title: t("shell.systemSettings"),
        description: t("shell.systemSettingsDesc"),
        icon: "settings",
      })
    }

    return [...builtIn, ...resolveControlPanelCategories(settingsCategories, locale)]
  }, [locale, resolveControlPanelCategories, settingsCategories, t, uiSnapshot.pages])

  const openControlPanelItem = useCallback(
    (item: ControlPanelItem) => {
      if (item.kind === "display") {
        openDisplayProps()
        return
      }
      if (item.kind === "system-settings") {
        const settingsPage = uiSnapshot.pages.find(
          (page) =>
            page.route === "settings" ||
            (page.pluginId === "orahako.settings" && page.id === "settings")
        )
        if (settingsPage) {
          const nextHref = syncRoute(settingsPage.pluginId, settingsPage.id)
          lastSyncedHrefRef.current = nextHref
          setWindows((prev) =>
            openOrFocusWindow(
              prev,
              {
                id: pluginWindowId(settingsPage.pluginId, settingsPage.id),
                kind: "plugin-page",
                pluginId: settingsPage.pluginId,
                pageId: settingsPage.id,
                title: item.title,
                icon: "settings",
              },
              viewport
            )
          )
        }
        return
      }
      if (item.kind === "category" && item.categoryId) {
        setWindows((prev) =>
          openOrFocusWindow(
            prev,
            {
              id: `settings-cat:${item.categoryId}`,
              kind: "settings-category",
              categoryId: item.categoryId,
              pluginId: item.pluginId,
              title: item.title,
              icon: item.icon,
            },
            viewport
          )
        )
      }
    },
    [openDisplayProps, syncRoute, uiSnapshot.pages, viewport]
  )

  const openShortcut = useCallback(
    (shortcut: DesktopShortcutItem) => {
      if (shortcut.kind === "explorer") {
        openExplorer()
      } else if (shortcut.kind === "control-panel") {
        openControlPanel()
      } else if (shortcut.kind === "display") {
        openDisplayProps()
      } else if (shortcut.kind === "app") {
        openAppWindow(shortcut.app)
      }
    },
    [openAppWindow, openControlPanel, openDisplayProps, openExplorer]
  )

  const handleDesktopPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if (
      (event.target as HTMLElement).closest(
        "[data-win98-icon], [data-win98-window], [data-win98-start-menu], [data-win98-taskbar], [data-win98-context-menu]"
      )
    ) {
      return
    }

    setSelectedIconId(null)
    setStartMenuOpen(false)
    setContextMenu(null)

    const startX = event.clientX
    const startY = event.clientY

    const handleMove = (moveEvent: PointerEvent) => {
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return
      setMarquee({
        startX,
        startY,
        currentX: moveEvent.clientX,
        currentY: moveEvent.clientY,
      })
    }

    const handleUp = () => {
      setMarquee(null)
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
  }

  const handleDesktopContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-win98-window]")) return
    event.preventDefault()
    setStartMenuOpen(false)
    const menuW = 196
    const menuH = 180
    const left = Math.min(event.clientX, Math.max(4, viewport.width - menuW - 4))
    const onTaskbar = Boolean((event.target as HTMLElement).closest("[data-win98-taskbar]"))
    if (onTaskbar) {
      setContextMenu({ left, bottom: TASKBAR_HEIGHT })
      return
    }
    if (event.clientY + menuH > viewport.height - TASKBAR_HEIGHT) {
      setContextMenu({ left, bottom: Math.max(TASKBAR_HEIGHT, viewport.height - event.clientY) })
      return
    }
    setContextMenu({ left, top: Math.max(4, event.clientY) })
  }

  const win98Css = useMemo(() => buildWin98Styles(scheme), [scheme])
  const bannerNode = renderSlot("shell.banner")
  const activityNode = renderSlot("shell.activity")
  const headerActionsNode = renderSlot("shell.header.actions")
  const overlayNode = renderSlot("shell.overlay")

  const renderWindowBody = (win: DesktopWindow): ReactNode => {
    switch (win.kind) {
      case "plugin-page":
        if (!win.pluginId || !win.pageId) return null
        if (typeof renderPage === "function") {
          return renderPage(win.pluginId, win.pageId)
        }
        return activeWindowId === win.id ? children : null

      case "explorer":
        return (
          <ExplorerWindowContent
            apps={apps}
            viewMode={explorerView}
            onViewModeChange={actions.setExplorerView}
            onOpenApp={openAppWindow}
            labels={{
              address: t("shell.address"),
              allApps: t("shell.allApps"),
              viewIcons: t("shell.viewIcons"),
              viewList: t("shell.viewList"),
              objectsCount: (count) => t("shell.objectsCount", { count }),
              emptyDesktop: t("shell.emptyDesktop"),
            }}
          />
        )

      case "control-panel":
        return (
          <ControlPanelContent
            items={controlPanelItems}
            onOpenItem={openControlPanelItem}
            labels={{
              title: t("shell.controlPanel"),
              address: t("shell.address"),
              defaultDesc: t("shell.controlPanelDesc"),
              objectsCount: (count) => t("shell.objectsCount", { count }),
            }}
          />
        )

      case "settings-category":
        if (!win.categoryId) return null
        return renderSlot("settings.category.panel", {}, { key: win.categoryId })

      case "display":
        return (
          <DisplayPropertiesContent
            wallpaper={wallpaper}
            scheme={scheme}
            onWallpaperChange={actions.setWallpaper}
            onSchemeChange={actions.setScheme}
            onClose={() => setWindows((prev) => closeWindow(prev, win.id))}
            labels={{
              tabBackground: t("shell.display.tabBackground"),
              tabAppearance: t("shell.display.tabAppearance"),
              wallpaperLabel: t("shell.display.wallpaperLabel"),
              schemeLabel: t("shell.display.schemeLabel"),
              wallpapers: {
                teal: t("shell.display.wallpaperTeal"),
                clouds: t("shell.display.wallpaperClouds"),
                grid: t("shell.display.wallpaperGrid"),
                ocean: t("shell.display.wallpaperOcean"),
                forest: t("shell.display.wallpaperForest"),
              },
              schemes: {
                standard: t("shell.display.schemeStandard"),
                rainy: t("shell.display.schemeRainy"),
                rose: t("shell.display.schemeRose"),
                spruce: t("shell.display.schemeSpruce"),
                plum: t("shell.display.schemePlum"),
              },
              applyHint: t("shell.display.applyHint"),
              ok: t("shell.display.ok"),
            }}
          />
        )

      case "about":
        return (
          <AboutWin98Content
            brand={t("shell.brand")}
            versionLine={t("shell.aboutDialog.versionLine")}
            desc={t("shell.aboutDialog.desc")}
            pluginsLoadedText={t("shell.aboutDialog.pluginsLoaded", {
              pages: uiSnapshot.pages.length,
              nav: uiSnapshot.navigation.length,
            })}
            switchDefaultLabel={t("shell.aboutDialog.switchDefault")}
            okLabel={t("shell.aboutDialog.ok")}
            onSwitchDefault={() => selectShell(undefined)}
            onClose={() => setWindows((prev) => closeWindow(prev, win.id))}
          />
        )
    }
  }

  const desktopBody = (
    <div
      data-shell="win98"
      className="relative h-dvh w-screen overflow-hidden select-none"
      style={{
        background: WIN98_WALLPAPERS[wallpaper],
        paddingBottom: TASKBAR_HEIGHT,
      }}
      onPointerDown={handleDesktopPointerDown}
      onContextMenu={handleDesktopContextMenu}
    >
      <style data-win98-shell-styles="">{win98Css}</style>

      {/* Optional top banner slot — hidden completely via CSS when no banner content is rendered */}
      {bannerNode && (
        <div className="w98-banner-host w98-window relative z-[5] mx-2 mt-2 p-1">
          {bannerNode}
        </div>
      )}

      {/* Fullscreen route (login / onboarding) rendered inside a classic Win98 logon frame */}
      {isFullscreenRoute ? (
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="w98-window flex max-h-[90vh] w-full max-w-[540px] flex-col p-[3px]">
            <div className="w98-titlebar-active flex h-[22px] items-center gap-1.5 px-1.5">
              <Win98Icon kind="start" size={14} />
              <span className="text-[12px] font-bold">{t("shell.logonTitle")}</span>
            </div>
            <div
              className="w98-sunken mt-[2px] flex-1 overflow-auto bg-white p-3"
              data-w98-page-viewport="true"
            >
              {children}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Classic Vertical Column Desktop Icon Grid */}
          <div
            data-win98-desktop-icons="true"
            className="grid h-full w-fit auto-cols-[84px] grid-flow-col grid-rows-[repeat(auto-fill,88px)] content-start gap-1.5 p-3"
          >
            {desktopShortcuts.map((shortcut) => {
              const selected = selectedIconId === shortcut.id
              return (
                <button
                  key={shortcut.id}
                  type="button"
                  data-win98-icon={shortcut.id}
                  className="flex h-[82px] w-[80px] flex-col items-center justify-start gap-1 p-1 text-center focus:outline-none"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedIconId(shortcut.id)
                    setStartMenuOpen(false)
                    setContextMenu(null)
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    openShortcut(shortcut)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      openShortcut(shortcut)
                    }
                  }}
                >
                  <div
                    className="flex h-[36px] w-[36px] items-center justify-center"
                    style={selected ? { filter: "brightness(0.85) saturate(1.2)" } : undefined}
                  >
                    <Win98Icon kind={shortcut.icon} size={32} />
                  </div>
                  <span
                    className="line-clamp-2 max-w-[76px] px-1 text-[11px] leading-tight text-white break-words"
                    style={
                      selected
                        ? {
                            background: "var(--w98-accent)",
                            color: "var(--w98-accent-fg)",
                            outline: "1px dotted #ffff00",
                          }
                        : {
                            textShadow: "1px 1px 1px rgba(0, 0, 0, 0.85)",
                          }
                    }
                  >
                    {shortcut.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Rubber-band Selection Marquee */}
          {marquee && (
            <div
              className="pointer-events-none fixed z-[4]"
              style={{
                left: Math.min(marquee.startX, marquee.currentX),
                top: Math.min(marquee.startY, marquee.currentY),
                width: Math.abs(marquee.currentX - marquee.startX),
                height: Math.abs(marquee.currentY - marquee.startY),
                border: "1px dotted #ffffff",
                background: "rgba(0, 0, 128, 0.2)",
              }}
            />
          )}

          {/* Open Windows */}
          {windows.map((win) => (
            <Win98Window
              key={win.id}
              win={win}
              isActive={activeWindowId === win.id}
              viewport={viewport}
              statusText={t("shell.ready")}
              loadingStatusText={loadingStatusText}
              isHttpLoading={isHttpLoading}
              menuActions={{
                onCascade: () => setWindows((prev) => cascadeWindows(prev, viewport)),
                onTileH: () => setWindows((prev) => tileWindows(prev, viewport, "horizontal")),
                onTileV: () => setWindows((prev) => tileWindows(prev, viewport, "vertical")),
                onOpenExplorer: openExplorer,
                onOpenDisplayProps: openDisplayProps,
                onOpenAbout: openAbout,
              }}
              labels={{
                minimize: t("shell.minimize"),
                maximize: t("shell.maximize"),
                restore: t("shell.restore"),
                close: t("shell.close"),
                menuWindow: t("shell.menuWindow"),
                menuView: t("shell.menuView"),
                menuHelp: t("shell.menuHelp"),
                cascade: t("shell.cascade"),
                tileH: t("shell.tileH"),
                tileV: t("shell.tileV"),
                explorer: t("shell.explorer"),
                displayProps: t("shell.displayProps"),
                about: t("shell.about"),
              }}
              onFocus={() => handleFocusWindow(win)}
              onMinimize={(rect) => handleMinimizeWindow(win.id, rect)}
              onToggleMaximize={() => setWindows((prev) => toggleMaximizeWindow(prev, win.id))}
              onClose={() => handleCloseWindow(win.id)}
              onBoundsChange={(bounds) =>
                setWindows((prev) => updateWindowBounds(prev, win.id, bounds, viewport))
              }
            >
              {renderWindowBody(win)}
            </Win98Window>
          ))}

          {/* Desktop Right-Click Context Menu */}
          {contextMenu && (
            <div
              data-win98-context-menu="true"
              className="w98-window fixed z-[47] w-[196px] p-[3px] text-[12px] text-black select-none"
              style={{
                left: contextMenu.left,
                ...(contextMenu.top !== undefined ? { top: contextMenu.top } : {}),
                ...(contextMenu.bottom !== undefined ? { bottom: contextMenu.bottom } : {}),
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="w98-menu-item block w-full px-3 py-1 text-left"
                onClick={() => {
                  setWindows((prev) => cascadeWindows(prev, viewport))
                  setContextMenu(null)
                }}
              >
                {t("shell.cascade")}
              </button>
              <button
                type="button"
                className="w98-menu-item block w-full px-3 py-1 text-left"
                onClick={() => {
                  setWindows((prev) => tileWindows(prev, viewport, "horizontal"))
                  setContextMenu(null)
                }}
              >
                {t("shell.tileH")}
              </button>
              <button
                type="button"
                className="w98-menu-item block w-full px-3 py-1 text-left"
                onClick={() => {
                  setWindows((prev) => tileWindows(prev, viewport, "vertical"))
                  setContextMenu(null)
                }}
              >
                {t("shell.tileV")}
              </button>
              <button
                type="button"
                className="w98-menu-item block w-full px-3 py-1 text-left"
                onClick={() => {
                  setWindows((prev) => minimizeAllWindows(prev))
                  setContextMenu(null)
                }}
              >
                {t("shell.minimizeAll")}
              </button>
              <div className="my-1 border-t border-[#808080] border-b border-b-white" />
              <button
                type="button"
                className="w98-menu-item block w-full px-3 py-1 text-left"
                onClick={() => {
                  openDisplayProps()
                  setContextMenu(null)
                }}
              >
                {t("shell.properties")}
              </button>
              <button
                type="button"
                className="w98-menu-item block w-full px-3 py-1 text-left"
                onClick={() => {
                  setContextMenu(null)
                  selectShell(undefined)
                }}
              >
                {t("shell.restoreDefault")}
              </button>
            </div>
          )}

          {/* Taskbar & Start Menu */}
          <Win98Taskbar
            brand={t("shell.brand")}
            windows={windows}
            activeWindowId={activeWindowId}
            apps={apps}
            startMenuOpen={startMenuOpen}
            onToggleStartMenu={() => {
              setContextMenu(null)
              setStartMenuOpen((prev) => !prev)
            }}
            onCloseStartMenu={() => setStartMenuOpen(false)}
            onOpenApp={openAppWindow}
            onOpenExplorer={openExplorer}
            onOpenControlPanel={openControlPanel}
            onOpenDisplayProps={openDisplayProps}
            onOpenAbout={openAbout}
            onShowDesktop={() =>
              setWindows((prev) => {
                const hasVisible = prev.some((w) => !w.minimized)
                return hasVisible
                  ? minimizeAllWindows(prev)
                  : prev.map((w) => ({ ...w, minimized: false }))
              })
            }
            onSwitchDefaultShell={() => selectShell(undefined)}
            onTaskButtonClick={handleTaskButtonClick}
            activitySlot={activityNode}
            headerActionsSlot={headerActionsNode}
            isNetworkBusy={isHttpLoading}
            networkTooltip={isHttpLoading ? loadingStatusText : t("shell.ready")}
            labels={{
              start: t("shell.start"),
              programs: t("shell.programs"),
              explorer: t("shell.explorer"),
              controlPanel: t("shell.controlPanel"),
              displayProps: t("shell.displayProps"),
              about: t("shell.about"),
              restoreDefault: t("shell.restoreDefault"),
              showDesktop: t("shell.showDesktop"),
            }}
          />
        </>
      )}
    </div>
  )

  return (
    <Win98IconAssetsProvider urls={iconUrls}>
      <BackLayerProvider registerBackHandler={registerBackHandler}>
        {renderSlotChain("shell.gate", desktopBody)}
        {overlayNode}
        <Toaster theme="light" position="bottom-right" />
      </BackLayerProvider>
    </Win98IconAssetsProvider>
  )
}
