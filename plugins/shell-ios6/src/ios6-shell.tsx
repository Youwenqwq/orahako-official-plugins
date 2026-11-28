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
import { ChevronLeft, Lock, Monitor, Search, Smartphone } from "lucide-react"
import "./slots-declare"
import type { Ios6Dictionary } from "./dictionary"
import { Ios6AppIcon } from "./ios6-icons"
import { Ios6LockScreen } from "./ios6-lock-screen"
import { Ios6SettingsPanel, type WallpaperOption } from "./ios6-settings"
import { Ios6Spotlight } from "./ios6-spotlight"
import { Ios6StatusBar } from "./ios6-status-bar"
import { IOS6_GLOBAL_CSS } from "./ios6-styles"
import {
  computeSpringboardSwipe,
  partitionSpringBoardApps,
  readSessionUnlocked,
  resolveEffectiveShowStatusBar,
  resolveGridConfig,
  resolveIos6IconKind,
  writeSessionUnlocked,
  type SpringBoardAppEntry,
  type SpringBoardSettingsEntry,
  type ViewportSize,
} from "./springboard"
import type { Ios6StoreInstance, Ios6WallpaperId } from "./store"

export const ios6ShellChildren = {
  "shell.gate": { kind: "chain" },
  "shell.banner": { kind: "list" },
  "shell.activity": { kind: "list" },
  "shell.header.actions": { kind: "list" },
  "shell.sidebar.footer": { kind: "list" },
  "shell.overlay": { kind: "list" },
  "settings.category.panel": { kind: "keyed" },
} as const

export interface Ios6ShellInject {
  readonly hooks: {
    readonly ui: ObservableSource<PluginUIServiceSnapshot>
    readonly location: ObservableSource<RouteLocation>
    readonly navRevision: ObservableSource<number>
    readonly httpActivity: ObservableSource<NetworkActivitySnapshot>
    readonly settingsCategories: ObservableSource<readonly PluginSettingsCategory[]>
  }
  readonly resolveSpringBoardApps: (
    uiSnapshot: PluginUIServiceSnapshot,
    locale: PluginLocale
  ) => readonly SpringBoardAppEntry[]
  readonly resolveSettingsEntries: (
    categories: readonly PluginSettingsCategory[],
    uiSnapshot: PluginUIServiceSnapshot,
    locale: PluginLocale
  ) => readonly SpringBoardSettingsEntry[]
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

export type Ios6ShellProps = DerivedComponentProps<
  ShellOwnerProps,
  Ios6Dictionary,
  typeof ios6ShellChildren,
  Ios6StoreInstance,
  Ios6ShellInject
>

type ActiveIos6View =
  | { readonly kind: "springboard" }
  | { readonly kind: "settings" }
  | {
      readonly kind: "plugin-app"
      readonly pluginId: string
      readonly pageId: string
      readonly title: string
    }
  | {
      readonly kind: "settings-category"
      readonly categoryId: string
      readonly title: string
    }

function readViewport(): ViewportSize {
  if (typeof window === "undefined") return { width: 1280, height: 800 }
  return { width: window.innerWidth, height: window.innerHeight }
}

const WALLPAPER_CLASS: Record<Ios6WallpaperId, string> = {
  droplets: "ios6-wallpaper-droplets",
  wave: "ios6-wallpaper-wave",
  linen: "ios6-wallpaper-linen",
  aurora: "ios6-wallpaper-aurora",
  leather: "ios6-wallpaper-leather",
}

export const Ios6Shell: SlotComponent<Ios6ShellProps> = (props) => {
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
    resolveSpringBoardApps,
    resolveSettingsEntries,
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

  const wallpaper = useStore((s) => s.wallpaper)
  const lockScreenEnabled = useStore((s) => s.lockScreenEnabled)
  const rememberUnlockState = useStore((s) => s.rememberUnlockState)
  const legacyShowStatusBar = useStore((s) => s.showStatusBar)
  const statusBarMode = useStore((s) => s.statusBarMode)
  const lightThemeContent = useStore((s) => s.lightThemeContent) ?? true
  const desktopMode = useStore((s) => s.desktopMode)
  const showBadges = useStore((s) => s.showBadges)
  const showSpotlight = useStore((s) => s.showSpotlight)

  const [viewport, setViewport] = useState<ViewportSize>(readViewport)
  const [hasNativeSafeAreaTop, setHasNativeSafeAreaTop] = useState(false)
  const [locked, setLocked] = useState<boolean>(() => {
    if (!lockScreenEnabled) return false
    if (rememberUnlockState && readSessionUnlocked()) return false
    return true
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [swipeDragOffsetPx, setSwipeDragOffsetPx] = useState(0)
  const [isSwipingHorizontal, setIsSwipingHorizontal] = useState(false)
  const [spotlightOpen, setSpotlightOpen] = useState(false)
  const [spotlightQuery, setSpotlightQuery] = useState("")
  const [activeView, setActiveView] = useState<ActiveIos6View>({ kind: "springboard" })

  const lastSyncedHrefRef = useRef<string | null>(null)
  const bootHandledRef = useRef(false)
  const initialHrefRef = useRef<string>(location.href)
  const safeTopProbeRef = useRef<HTMLDivElement | null>(null)
  const springboardTrackRef = useRef<HTMLDivElement | null>(null)
  const suppressNextAppClickRef = useRef(false)
  const swipeStateRef = useRef<{
    pointerId: number | null
    startX: number
    startY: number
    startTime: number
    lastX: number
    lastTime: number
    lockedAxis: "none" | "horizontal" | "vertical"
    containerWidth: number
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    lockedAxis: "none",
    containerWidth: 360,
  })

  const isDesktopViewport = viewport.width >= 768
  const isIphoneFrame = isDesktopViewport && desktopMode === "iphone"
  const wallpaperClass = WALLPAPER_CLASS[wallpaper] ?? "ios6-wallpaper-droplets"
  const isHttpLoading = httpActivity.active.length > 0

  const effectiveStatusBarMode =
    statusBarMode ?? (legacyShowStatusBar === false ? "off" : "auto")

  const showStatusBar = resolveEffectiveShowStatusBar({
    statusBarMode: effectiveStatusBarMode,
    legacyShowStatusBar,
    hasNativeSafeAreaTop,
    isIphoneFrame,
  })

  // Mark document root attributes cleanly while active
  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    root.dataset.orahakoShell = "ios6"
    if (lightThemeContent) {
      root.dataset.ios6LightContent = "true"
    } else {
      delete root.dataset.ios6LightContent
    }
    return () => {
      if (root.dataset.orahakoShell === "ios6") {
        delete root.dataset.orahakoShell
      }
      delete root.dataset.ios6LightContent
    }
  }, [lightThemeContent])

  // Track viewport size & native safe-area-inset-top dynamically
  useEffect(() => {
    if (typeof window === "undefined") return

    const measureSafeTop = () => {
      const probe = safeTopProbeRef.current
      if (!probe) return
      const rectHeight = probe.getBoundingClientRect().height
      const computedHeight = Number.parseFloat(window.getComputedStyle(probe).height) || 0
      const resolvedTop = Math.max(rectHeight, computedHeight)
      setHasNativeSafeAreaTop(resolvedTop > 0.5)
    }

    const onResize = () => {
      setViewport(readViewport())
      measureSafeTop()
    }

    measureSafeTop()
    const rafId = window.requestAnimationFrame(measureSafeTop)
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)

    let observer: MutationObserver | undefined
    if (typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(measureSafeTop)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style", "class"],
      })
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
      observer?.disconnect()
    }
  }, [])

  // Keep lock state aligned if lockScreenEnabled is turned off
  useEffect(() => {
    if (!lockScreenEnabled && locked) {
      setLocked(false)
    }
  }, [lockScreenEnabled, locked])

  const pluginApps = useMemo(
    () => resolveSpringBoardApps(uiSnapshot, locale),
    [resolveSpringBoardApps, uiSnapshot, locale]
  )

  const settingsEntries = useMemo(
    () => resolveSettingsEntries(settingsCategories, uiSnapshot, locale),
    [resolveSettingsEntries, settingsCategories, uiSnapshot, locale]
  )

  const activeRoutePage = useMemo(
    () => resolveActivePage(location, uiSnapshot),
    [resolveActivePage, location, uiSnapshot]
  )

  const isFullscreenRoute = Boolean(activeRoutePage?.fullscreen)

  // Synchronize explicit deep-links and post-boot route changes into the iOS 6 App viewport
  useEffect(() => {
    if (!activeRoutePage || activeRoutePage.fullscreen) return

    const hrefKey = location.href
    if (!bootHandledRef.current) {
      bootHandledRef.current = true
      const hadExplicitRoute =
        Boolean(location.route) ||
        (Boolean(location.pluginId) &&
          initialHrefRef.current !== "/" &&
          !activeRoutePage.primary)
      if (!hadExplicitRoute) {
        lastSyncedHrefRef.current = hrefKey
        return
      }
    }

    if (lastSyncedHrefRef.current === hrefKey) return
    lastSyncedHrefRef.current = hrefKey

    setActiveView({
      kind: "plugin-app",
      pluginId: activeRoutePage.pluginId,
      pageId: activeRoutePage.id,
      title: resolvePageTitle(activeRoutePage, locale),
    })
  }, [activeRoutePage, locale, location.href, location.pluginId, location.route, resolvePageTitle])

  const gridConfig = useMemo(
    () => resolveGridConfig(viewport, desktopMode),
    [desktopMode, viewport]
  )

  const builtinApps = useMemo(
    () => ({
      settingsApp: {
        key: "builtin:settings",
        kind: "builtin-settings" as const,
        title: t("shell.appSettings"),
        group: "system",
        groupLabel: t("shell.groupPlatform"),
        icon: "settings" as const,
        primary: false,
      },
      defaultShellApp: {
        key: "builtin:default-shell",
        kind: "builtin-default-shell" as const,
        title: t("shell.appDefaultShell"),
        group: "system",
        groupLabel: t("shell.groupPlatform"),
        icon: "power" as const,
        primary: false,
      },
    }),
    [t]
  )

  const partitioned = useMemo(
    () =>
      partitionSpringBoardApps(pluginApps, builtinApps, gridConfig.pageSize, {
        maxDockItems: gridConfig.isCompact ? 4 : 6,
        showBadges,
      }),
    [builtinApps, gridConfig.isCompact, gridConfig.pageSize, pluginApps, showBadges]
  )

  const totalPages = partitioned.pages.length
  const safePageIndex = Math.min(currentPage, Math.max(0, totalPages - 1))

  useEffect(() => {
    if (currentPage !== safePageIndex) {
      setCurrentPage(safePageIndex)
    }
  }, [currentPage, safePageIndex])

  const handleUnlock = useCallback(() => {
    setLocked(false)
    if (rememberUnlockState) {
      writeSessionUnlocked(true)
    }
  }, [rememberUnlockState])

  const handleLockNow = useCallback(() => {
    writeSessionUnlocked(false)
    if (!lockScreenEnabled) {
      actions.setLockScreenEnabled(true)
    }
    setSpotlightOpen(false)
    setActiveView({ kind: "springboard" })
    setLocked(true)
  }, [actions, lockScreenEnabled])

  const handleLaunchApp = useCallback(
    (app: SpringBoardAppEntry) => {
      if (app.kind === "builtin-settings") {
        setActiveView({ kind: "settings" })
        return
      }
      if (app.kind === "builtin-default-shell") {
        selectShell(undefined)
        return
      }
      if (app.pluginId && app.pageId) {
        const nextHref = syncRoute(app.pluginId, app.pageId, app.routeParams)
        lastSyncedHrefRef.current = nextHref
        setActiveView({
          kind: "plugin-app",
          pluginId: app.pluginId,
          pageId: app.pageId,
          title: app.title,
        })
      }
    },
    [selectShell, syncRoute]
  )

  const handleOpenSystemSettings = useCallback(() => {
    const settingsPage = uiSnapshot.pages.find(
      (page) =>
        page.route === "settings" ||
        (page.pluginId === "orahako.settings" && page.id === "settings")
    )
    if (settingsPage) {
      const nextHref = syncRoute(settingsPage.pluginId, settingsPage.id)
      lastSyncedHrefRef.current = nextHref
      setActiveView({
        kind: "plugin-app",
        pluginId: settingsPage.pluginId,
        pageId: settingsPage.id,
        title: resolvePageTitle(settingsPage, locale),
      })
    }
  }, [locale, resolvePageTitle, syncRoute, uiSnapshot.pages])

  const handleSelectSpotlightSetting = useCallback(
    (entry: SpringBoardSettingsEntry) => {
      if (entry.kind === "system-settings") {
        handleOpenSystemSettings()
        return
      }
      if (entry.categoryId) {
        setActiveView({
          kind: "settings-category",
          categoryId: entry.categoryId,
          title: entry.title,
        })
      }
    },
    [handleOpenSystemSettings]
  )

  const handleGoHome = useCallback(() => {
    if (spotlightOpen) {
      setSpotlightOpen(false)
      return
    }
    if (activeView.kind !== "springboard") {
      setActiveView({ kind: "springboard" })
      return
    }
    if (safePageIndex > 0) {
      setCurrentPage(0)
    }
  }, [activeView.kind, safePageIndex, spotlightOpen])

  // Register Android/hardware back button handler
  useEffect(() => {
    if (spotlightOpen) {
      return registerBackHandler(() => setSpotlightOpen(false), 30)
    }
    if (activeView.kind !== "springboard") {
      return registerBackHandler(() => setActiveView({ kind: "springboard" }), 20)
    }
    if (safePageIndex > 0) {
      return registerBackHandler(() => setCurrentPage(0), 10)
    }
    return undefined
  }, [activeView.kind, registerBackHandler, safePageIndex, spotlightOpen])

  // Escape closes spotlight or returns to SpringBoard
  useEffect(() => {
    if (typeof window === "undefined") return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (spotlightOpen) {
          setSpotlightOpen(false)
        } else if (activeView.kind !== "springboard") {
          setActiveView({ kind: "springboard" })
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [activeView.kind, spotlightOpen])

  // Real-time finger-tracking SpringBoard swipe with damped rebound
  const finishSpringboardSwipe = useCallback(
    (finalClientX: number) => {
      const state = swipeStateRef.current
      if (state.pointerId === null) return
      const wasHorizontal = state.lockedAxis === "horizontal"
      const deltaX = finalClientX - state.startX
      const elapsedMs = Math.max(16, performance.now() - state.startTime)
      const velocityPxPerMs = deltaX / elapsedMs

      state.pointerId = null
      state.lockedAxis = "none"
      setIsSwipingHorizontal(false)
      setSwipeDragOffsetPx(0)

      if (!wasHorizontal) return

      suppressNextAppClickRef.current = true
      window.setTimeout(() => {
        suppressNextAppClickRef.current = false
      }, 90)

      const decision = computeSpringboardSwipe({
        deltaX,
        currentPage: safePageIndex,
        totalPages,
        containerWidth: state.containerWidth,
        velocityPxPerMs,
      })

      if (decision.openSpotlight && showSpotlight) {
        setSpotlightOpen(true)
      } else if (decision.nextPage !== safePageIndex) {
        setCurrentPage(decision.nextPage)
      }
    },
    [safePageIndex, showSpotlight, totalPages]
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const onWindowPointerMove = (e: PointerEvent) => {
      const state = swipeStateRef.current
      if (state.pointerId !== e.pointerId) return
      const dx = e.clientX - state.startX
      const dy = e.clientY - state.startY

      if (state.lockedAxis === "none") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dx) > Math.abs(dy)) {
          state.lockedAxis = "horizontal"
          setIsSwipingHorizontal(true)
        } else {
          state.lockedAxis = "vertical"
          return
        }
      }

      if (state.lockedAxis === "horizontal") {
        state.lastX = e.clientX
        state.lastTime = performance.now()
        const { visualOffsetPx } = computeSpringboardSwipe({
          deltaX: dx,
          currentPage: safePageIndex,
          totalPages,
          containerWidth: state.containerWidth,
        })
        setSwipeDragOffsetPx(visualOffsetPx)
      }
    }

    const onWindowPointerEnd = (e: PointerEvent) => {
      const state = swipeStateRef.current
      if (state.pointerId !== e.pointerId) return
      finishSpringboardSwipe(Number.isFinite(e.clientX) ? e.clientX : state.lastX)
    }

    window.addEventListener("pointermove", onWindowPointerMove)
    window.addEventListener("pointerup", onWindowPointerEnd)
    window.addEventListener("pointercancel", onWindowPointerEnd)

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove)
      window.removeEventListener("pointerup", onWindowPointerEnd)
      window.removeEventListener("pointercancel", onWindowPointerEnd)
    }
  }, [finishSpringboardSwipe, safePageIndex, totalPages])

  const handleSpringboardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return
    const now = performance.now()
    swipeStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: now,
      lastX: e.clientX,
      lastTime: now,
      lockedAxis: "none",
      containerWidth: springboardTrackRef.current?.clientWidth || 360,
    }
  }

  const handleSpringboardClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressNextAppClickRef.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressNextAppClickRef.current = false
    }
  }

  const bannerNode = renderSlot("shell.banner")
  const activityNode = renderSlot("shell.activity")
  const headerActionsNode = renderSlot("shell.header.actions")
  const overlayNode = renderSlot("shell.overlay")

  const wallpaperOptions = useMemo<readonly WallpaperOption[]>(
    () => [
      { id: "droplets", label: t("shell.wpDroplets"), previewClass: "ios6-wallpaper-droplets" },
      { id: "wave", label: t("shell.wpWave"), previewClass: "ios6-wallpaper-wave" },
      { id: "linen", label: t("shell.wpLinen"), previewClass: "ios6-wallpaper-linen" },
      { id: "aurora", label: t("shell.wpAurora"), previewClass: "ios6-wallpaper-aurora" },
      { id: "leather", label: t("shell.wpLeather"), previewClass: "ios6-wallpaper-leather" },
    ],
    [t]
  )

  const formatLockDate = useCallback(
    (date: Date) => {
      try {
        return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
          month: "long",
          day: "numeric",
          weekday: "long",
        }).format(date)
      } catch {
        return date.toDateString()
      }
    },
    [locale]
  )

  const statusBarElement = showStatusBar ? (
    <Ios6StatusBar
      locked={locked}
      carrierLabel={isHttpLoading ? t("shell.loading") : t("shell.carrier")}
      respectSafeAreaTop={!isIphoneFrame}
    />
  ) : null

  const extendNavbarIntoSafeTop = !showStatusBar && !isIphoneFrame

  const renderDeviceScreenContent = (): ReactNode => {
    if (isFullscreenRoute) {
      return (
        <div className="ios6-pinstripe-bg flex size-full flex-col overflow-hidden">
          {statusBarElement}
          <header
            className="ios6-navbar flex shrink-0 items-center justify-between px-3 py-2"
            style={{
              paddingTop: extendNavbarIntoSafeTop ? "calc(8px + var(--ios6-safe-top))" : undefined,
              paddingLeft: isIphoneFrame ? "12px" : "max(12px, var(--ios6-safe-left))",
              paddingRight: isIphoneFrame ? "12px" : "max(12px, var(--ios6-safe-right))",
            }}
          >
            <span className="ios6-navbar-title text-[16px] font-bold">{t("shell.brand")}</span>
            <button
              type="button"
              onClick={() => selectShell(undefined)}
              className="ios6-nav-btn rounded-[6px] px-2.5 py-1 text-[11px] font-semibold"
            >
              {t("shell.restoreDefault")}
            </button>
          </header>
          <div
            className={`min-h-0 flex-1 overflow-y-auto p-3 ${
              lightThemeContent ? "ios6-light-viewport" : "bg-background text-foreground"
            }`}
            style={{
              paddingBottom: isIphoneFrame
                ? "16px"
                : "max(24px, calc(16px + var(--ios6-safe-bottom)))",
            }}
          >
            {children}
          </div>
        </div>
      )
    }

    if (locked) {
      return (
        <Ios6LockScreen
          wallpaperClass={wallpaperClass}
          locale={locale}
          showStatusBar={showStatusBar}
          respectSafeArea={!isIphoneFrame}
          clockTitle={t("shell.brand")}
          dateLabel={formatLockDate}
          slideLabel={t("shell.slideToUnlock")}
          slideHint={t("shell.slideHint")}
          onUnlock={handleUnlock}
          statusBarNode={
            <Ios6StatusBar
              locked
              carrierLabel={t("shell.carrier")}
              respectSafeAreaTop={!isIphoneFrame}
            />
          }
        />
      )
    }

    if (activeView.kind === "settings") {
      return (
        <div className="flex size-full flex-col overflow-hidden">
          {statusBarElement}
          <div className="min-h-0 flex-1">
            <Ios6SettingsPanel
              state={{
                wallpaper,
                lockScreenEnabled,
                rememberUnlockState,
                statusBarMode: effectiveStatusBarMode,
                lightThemeContent,
                desktopMode,
                showBadges,
                showSpotlight,
              }}
              isDesktopViewport={isDesktopViewport}
              respectSafeArea={!isIphoneFrame}
              includeSafeTopInNavbar={extendNavbarIntoSafeTop}
              wallpapers={wallpaperOptions}
              onUpdateState={(patch) => {
                if (patch.wallpaper !== undefined) actions.setWallpaper(patch.wallpaper)
                if (patch.lockScreenEnabled !== undefined)
                  actions.setLockScreenEnabled(patch.lockScreenEnabled)
                if (patch.rememberUnlockState !== undefined)
                  actions.setRememberUnlockState(patch.rememberUnlockState)
                if (patch.statusBarMode !== undefined)
                  actions.setStatusBarMode(patch.statusBarMode)
                if (patch.lightThemeContent !== undefined)
                  actions.setLightThemeContent(patch.lightThemeContent)
                if (patch.desktopMode !== undefined) actions.setDesktopMode(patch.desktopMode)
                if (patch.showBadges !== undefined) actions.setShowBadges(patch.showBadges)
                if (patch.showSpotlight !== undefined) actions.setShowSpotlight(patch.showSpotlight)
              }}
              onOpenLockScreen={handleLockNow}
              onOpenSystemSettings={handleOpenSystemSettings}
              onRestoreDefaultShell={() => selectShell(undefined)}
              onClose={() => setActiveView({ kind: "springboard" })}
              labels={{
                title: t("shell.settingsTitle"),
                done: t("shell.done"),
                sectionLockAndStatus: t("shell.sectionLockAndStatus"),
                enableLockScreen: t("shell.enableLockScreen"),
                enableLockScreenDesc: t("shell.enableLockScreenDesc"),
                rememberUnlock: t("shell.rememberUnlock"),
                rememberUnlockDesc: t("shell.rememberUnlockDesc"),
                statusBarMode: t("shell.statusBarMode"),
                statusBarModeDesc: t("shell.statusBarModeDesc"),
                statusBarAuto: t("shell.statusBarAuto"),
                statusBarAlways: t("shell.statusBarAlways"),
                statusBarOff: t("shell.statusBarOff"),
                lockNow: t("shell.lockNow"),
                sectionWallpaper: t("shell.sectionWallpaper"),
                sectionDisplay: t("shell.sectionDisplay"),
                desktopMode: t("shell.desktopMode"),
                desktopModeIpad: t("shell.desktopModeIpad"),
                desktopModeIphone: t("shell.desktopModeIphone"),
                lightThemeContent: t("shell.lightThemeContent"),
                lightThemeContentDesc: t("shell.lightThemeContentDesc"),
                showBadges: t("shell.showBadges"),
                showSpotlight: t("shell.showSpotlight"),
                sectionOrahako: t("shell.sectionOrahako"),
                openSystemSettings: t("shell.openSystemSettings"),
                openSystemSettingsDesc: t("shell.openSystemSettingsDesc"),
                switchDefaultShell: t("shell.switchDefaultShell"),
                switchDefaultShellDesc: t("shell.switchDefaultShellDesc"),
              }}
            />
          </div>
        </div>
      )
    }

    if (activeView.kind === "plugin-app" || activeView.kind === "settings-category") {
      const appContent =
        activeView.kind === "plugin-app"
          ? typeof renderPage === "function"
            ? renderPage(activeView.pluginId, activeView.pageId)
            : children
          : renderSlot("settings.category.panel", {}, { key: activeView.categoryId })

      return (
        <div
          className="flex size-full flex-col overflow-hidden bg-[#ebeff3]"
          data-testid="ios6-app-view"
        >
          {statusBarElement}
          {/* Classic Brushed Metal UINavigationBar */}
          <header
            className="ios6-navbar flex shrink-0 items-center justify-between gap-2 px-2.5 py-1.5"
            style={{
              paddingTop: extendNavbarIntoSafeTop ? "calc(6px + var(--ios6-safe-top))" : undefined,
              paddingLeft: isIphoneFrame ? "10px" : "max(10px, var(--ios6-safe-left))",
              paddingRight: isIphoneFrame ? "10px" : "max(10px, var(--ios6-safe-right))",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView({ kind: "springboard" })}
              data-testid="ios6-nav-back"
              className="ios6-nav-btn inline-flex shrink-0 items-center gap-0.5 rounded-[6px] px-2.5 py-1 text-[12px] font-bold"
            >
              <ChevronLeft className="-ml-1 size-3.5" strokeWidth={2.75} />
              <span>{t("shell.home")}</span>
            </button>

            <h1 className="ios6-navbar-title min-w-0 flex-1 truncate text-center text-[16px] font-bold">
              {activeView.title}
            </h1>

            <div className="flex shrink-0 items-center gap-1">
              {headerActionsNode}
              <button
                type="button"
                onClick={() => setActiveView({ kind: "settings" })}
                className="ios6-nav-btn rounded-[6px] px-2 py-1 text-[11px] font-semibold"
              >
                {t("shell.appSettings")}
              </button>
            </div>
          </header>

          {bannerNode && (
            <div className="ios6-banner-host empty:hidden border-b border-[#b7c0c9] bg-[#f8f9fb] px-3 py-1.5 text-[#1f242c]">
              {bannerNode}
            </div>
          )}

          {/* Plugin Content Viewport (Adapts softly to iOS 6 light palette by default) */}
          <main
            className={`min-h-0 flex-1 overflow-y-auto ${
              lightThemeContent ? "ios6-light-viewport" : "bg-background text-foreground"
            }`}
            style={{
              paddingLeft: isIphoneFrame ? "0px" : "var(--ios6-safe-left)",
              paddingRight: isIphoneFrame ? "0px" : "var(--ios6-safe-right)",
            }}
            data-ios6-page-viewport="true"
          >
            <div
              className={gridConfig.isCompact ? "p-3" : "mx-auto w-full max-w-[960px] p-4"}
              style={{
                paddingBottom: isIphoneFrame
                  ? "16px"
                  : "max(24px, calc(14px + var(--ios6-safe-bottom)))",
              }}
            >
              {appContent}
            </div>
          </main>
        </div>
      )
    }

    // SpringBoard Home Screen
    const iconSize = gridConfig.isCompact ? 56 : 64
    const reflectionHeight = Math.round(iconSize * 0.25)

    return (
      <div
        className={`relative flex size-full flex-col overflow-hidden ${wallpaperClass}`}
        data-testid="ios6-springboard"
      >
        {statusBarElement ??
          (!isIphoneFrame ? (
            <div aria-hidden="true" style={{ height: "var(--ios6-safe-top)", flexShrink: 0 }} />
          ) : null)}

        {/* Optional Banner Slot (Hidden completely unless slot renders actual DOM elements) */}
        {bannerNode && (
          <div className="ios6-banner-host empty:hidden mx-3 mt-2 rounded-[10px] border border-white/25 bg-black/55 px-3 py-2 text-xs text-white shadow-md backdrop-blur-xs">
            {bannerNode}
          </div>
        )}

        {/* Quick Top Utility Strip on SpringBoard (Spotlight + Mode/Lock/Exit) */}
        <div
          className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2.5"
          style={{
            paddingLeft: isIphoneFrame ? "14px" : "max(14px, var(--ios6-safe-left))",
            paddingRight: isIphoneFrame ? "14px" : "max(14px, var(--ios6-safe-right))",
          }}
        >
          {showSpotlight ? (
            <button
              type="button"
              onClick={() => setSpotlightOpen(true)}
              data-testid="ios6-spotlight-trigger"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11.5px] font-medium text-white/90 shadow-inner backdrop-blur-xs transition-colors hover:bg-black/50"
            >
              <Search className="size-3.5 text-white/80" />
              <span>{t("shell.spotlightHint")}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">
            {activityNode}
            {isDesktopViewport && !isIphoneFrame && (
              <button
                type="button"
                onClick={() => actions.setDesktopMode("iphone")}
                title={t("shell.desktopModeIphone")}
                className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 transition-colors hover:bg-black/50"
              >
                <Smartphone className="size-3" />
                <span className="hidden sm:inline">{t("shell.desktopModeIphone")}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLockNow}
              title={t("shell.lockNow")}
              className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/90 transition-colors hover:bg-black/50"
            >
              <Lock className="size-3" />
            </button>
          </div>
        </div>

        {/* SpringBoard Finger-Tracking Multi-Page App Grid */}
        <div
          ref={springboardTrackRef}
          onPointerDown={handleSpringboardPointerDown}
          onClickCapture={handleSpringboardClickCapture}
          className="relative min-h-0 flex-1 touch-pan-y overflow-hidden"
          data-testid="ios6-springboard-viewport"
        >
          <div
            className={`flex h-full w-full ${
              isSwipingHorizontal
                ? ""
                : "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            }`}
            style={{
              transform: `translate3d(calc(-${safePageIndex * 100}% + ${swipeDragOffsetPx}px), 0, 0)`,
            }}
          >
            {partitioned.pages.map((pageApps: readonly SpringBoardAppEntry[], pageIdx: number) => (
              <div
                key={pageIdx}
                className="flex h-full w-full shrink-0 items-start justify-center overflow-y-auto px-3 pt-3 pb-2"
                style={{
                  paddingLeft: isIphoneFrame ? "12px" : "max(12px, var(--ios6-safe-left))",
                  paddingRight: isIphoneFrame ? "12px" : "max(12px, var(--ios6-safe-right))",
                }}
              >
                <div
                  className="grid w-full justify-items-center gap-x-2 gap-y-4"
                  style={{
                    maxWidth: gridConfig.isCompact ? "360px" : "760px",
                    gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(0, 1fr))`,
                  }}
                >
                  {pageApps.map((app: SpringBoardAppEntry) => (
                    <button
                      key={app.key}
                      type="button"
                      onClick={() => handleLaunchApp(app)}
                      data-testid={`ios6-app-${app.key}`}
                      className="group flex w-full max-w-[82px] flex-col items-center gap-1.5 rounded-[10px] py-0.5 text-center transition-transform active:scale-95 focus:outline-none"
                    >
                      <Ios6AppIcon
                        kind={app.icon}
                        size={iconSize}
                        badgeCount={app.badgeCount}
                        badgeComponent={app.badgeComponent}
                        className="transition-transform group-hover:scale-[1.03]"
                      />
                      <span className="ios6-icon-label line-clamp-1 w-full px-0.5 text-[11.5px] leading-tight font-medium">
                        {app.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Page Indicator Dots */}
        <div className="flex shrink-0 items-center justify-center gap-2 py-2">
          {showSpotlight && (
            <button
              type="button"
              onClick={() => setSpotlightOpen(true)}
              aria-label={t("shell.spotlightPlaceholder")}
              className="flex size-4 items-center justify-center text-white/65 hover:text-white"
            >
              <Search className="size-2.5" strokeWidth={2.75} />
            </button>
          )}
          {partitioned.pages.map((_: readonly SpringBoardAppEntry[], idx: number) => {
            const active = idx === safePageIndex
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Page ${idx + 1}`}
                onClick={() => setCurrentPage(idx)}
                className={`size-[7px] rounded-full transition-all ${
                  active ? "scale-110 bg-white shadow" : "bg-white/40 hover:bg-white/65"
                }`}
              />
            )
          })}
        </div>

        {/* Classic 3D Frosted Glass Dock with Mirror Reflections */}
        <div
          className="ios6-dock-shelf relative z-10 shrink-0 px-3 pt-1"
          style={{
            ["--ios6-dock-safe-bottom" as string]: isIphoneFrame
              ? "0px"
              : "var(--ios6-safe-bottom)",
            paddingBottom: isIphoneFrame ? "10px" : "max(10px, var(--ios6-safe-bottom))",
            paddingLeft: isIphoneFrame ? "12px" : "max(12px, var(--ios6-safe-left))",
            paddingRight: isIphoneFrame ? "12px" : "max(12px, var(--ios6-safe-right))",
          }}
          data-testid="ios6-dock"
        >
          <div
            className="relative z-10 mx-auto grid w-full justify-items-center gap-2"
            style={{
              maxWidth: gridConfig.isCompact ? "360px" : "620px",
              gridTemplateColumns: `repeat(${partitioned.dockApps.length}, minmax(0, 1fr))`,
            }}
          >
            {partitioned.dockApps.map((app: SpringBoardAppEntry) => (
              <button
                key={app.key}
                type="button"
                onClick={() => handleLaunchApp(app)}
                data-testid={`ios6-dock-${app.key}`}
                className="group flex w-full max-w-[78px] flex-col items-center text-center transition-transform active:scale-95 focus:outline-none"
              >
                <div className="flex flex-col items-center">
                  <Ios6AppIcon
                    kind={app.icon}
                    size={iconSize}
                    badgeCount={app.badgeCount}
                    badgeComponent={app.badgeComponent}
                    className="transition-transform group-hover:scale-[1.04]"
                  />
                  <div
                    aria-hidden="true"
                    className="ios6-dock-reflection relative mt-[1px] overflow-hidden"
                    style={{ width: iconSize, height: reflectionHeight }}
                  >
                    <div
                      style={{
                        transform: "scaleY(-1)",
                        transformOrigin: "center center",
                      }}
                    >
                      <Ios6AppIcon kind={app.icon} size={iconSize} glossy={false} />
                    </div>
                  </div>
                </div>
                <span className="ios6-icon-label relative z-10 -mt-[4px] line-clamp-1 w-full text-[11px] leading-tight font-medium">
                  {app.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Spotlight Overlay */}
        <Ios6Spotlight
          open={spotlightOpen}
          query={spotlightQuery}
          onQueryChange={setSpotlightQuery}
          onClose={() => {
            setSpotlightOpen(false)
            setSpotlightQuery("")
          }}
          apps={partitioned.allSearchableApps}
          settingsEntries={settingsEntries}
          onSelectApp={handleLaunchApp}
          onSelectSetting={handleSelectSpotlightSetting}
          labels={{
            placeholder: t("shell.spotlightPlaceholder"),
            appsHeader: t("shell.spotlightApps"),
            settingsHeader: t("shell.spotlightSettings"),
            empty: t("shell.spotlightEmpty"),
            cancel: t("shell.cancel"),
          }}
        />
      </div>
    )
  }

  const shellStage = (
    <div
      data-shell="ios6"
      className={`ios6-root relative h-dvh w-screen overflow-hidden ${
        isIphoneFrame ? "ios6-desktop-stage flex flex-col items-center justify-center p-4" : ""
      }`}
    >
      <style data-ios6-shell-styles="">{IOS6_GLOBAL_CSS}</style>
      <div
        ref={safeTopProbeRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 0,
          height: "var(--ios6-safe-top)",
          pointerEvents: "none",
          visibility: "hidden",
        }}
      />

      {isIphoneFrame ? (
        <div className="flex max-h-full flex-col items-center gap-3">
          {/* Desktop Workbench Quick Toolbar */}
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[12px] text-white/85 shadow-lg">
            <span className="font-semibold text-white">{t("shell.brand")}</span>
            <span className="text-white/30">|</span>
            <button
              type="button"
              onClick={() => actions.setDesktopMode("ipad")}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-white/10"
            >
              <Monitor className="size-3.5" />
              <span>{t("shell.desktopModeIpad")}</span>
            </button>
            <button
              type="button"
              onClick={() => selectShell(undefined)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-red-300 hover:bg-red-500/20"
            >
              <span>{t("shell.restoreDefault")}</span>
            </button>
          </div>

          {/* Classic iPhone 4S/5 Hardware Frame */}
          <div
            className="ios6-iphone-bezel flex flex-col items-center rounded-[44px] px-[14px] pt-[16px] pb-[14px]"
            style={{
              width: "min(396px, 94vw)",
              height: "min(760px, calc(100dvh - 76px))",
            }}
            data-testid="ios6-iphone-frame"
          >
            {/* Front Camera + Speaker Grill */}
            <div className="mb-3 flex shrink-0 flex-col items-center gap-2">
              <span className="size-2.5 rounded-full border border-white/15 bg-[#1b2436]" />
              <div className="flex items-center gap-2.5">
                <span className="size-2 rounded-full bg-[#1a1c20]" />
                <span className="h-[5px] w-[54px] rounded-full border border-white/10 bg-[#17191c]" />
              </div>
            </div>

            {/* Glass Screen */}
            <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[4px] border border-black bg-black shadow-inner">
              {renderDeviceScreenContent()}
            </div>

            {/* Physical Home Button */}
            <div className="mt-3 flex shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={handleGoHome}
                aria-label={t("shell.home")}
                data-testid="ios6-hardware-home"
                className="ios6-home-button flex size-[44px] items-center justify-center rounded-full transition-transform active:scale-95"
              >
                <span className="size-[15px] rounded-[4px] border border-[#6e747d]/70" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative size-full overflow-hidden">{renderDeviceScreenContent()}</div>
      )}
    </div>
  )

  return (
    <BackLayerProvider registerBackHandler={registerBackHandler}>
      {renderSlotChain("shell.gate", shellStage)}
      {overlayNode}
      <Toaster theme={lightThemeContent ? "light" : "system"} position="bottom-right" />
    </BackLayerProvider>
  )
}

export { resolveIos6IconKind }
