import { defineStore } from "@orahako/sdk"

export type Ios6WallpaperId = "droplets" | "wave" | "linen" | "aurora" | "leather"

export type Ios6DesktopMode = "ipad" | "iphone"

export type Ios6StatusBarMode = "auto" | "always" | "off"

export interface Ios6StoreState {
  readonly wallpaper: Ios6WallpaperId
  readonly lockScreenEnabled: boolean
  readonly rememberUnlockState: boolean
  /** Legacy boolean kept for backwards compatibility with v1 preferences. */
  readonly showStatusBar: boolean
  readonly statusBarMode: Ios6StatusBarMode
  readonly lightThemeContent: boolean
  readonly showBadges: boolean
  readonly showSpotlight: boolean
  readonly desktopMode: Ios6DesktopMode
}

export type Ios6ShellState = Ios6StoreState

export function createDefaultIos6State(): Ios6StoreState {
  return {
    wallpaper: "droplets",
    lockScreenEnabled: true,
    rememberUnlockState: true,
    showStatusBar: true,
    statusBarMode: "auto",
    lightThemeContent: true,
    showBadges: true,
    showSpotlight: true,
    desktopMode: "ipad",
  }
}

export function migrateIos6StoreState(persisted: unknown): Ios6StoreState {
  const base = createDefaultIos6State()
  if (typeof persisted !== "object" || persisted === null || Array.isArray(persisted)) {
    return base
  }
  const raw = persisted as Partial<Ios6StoreState>
  const statusBarMode: Ios6StatusBarMode =
    raw.statusBarMode === "auto" || raw.statusBarMode === "always" || raw.statusBarMode === "off"
      ? raw.statusBarMode
      : raw.showStatusBar === false
        ? "off"
        : "auto"

  return {
    wallpaper:
      raw.wallpaper === "droplets" ||
      raw.wallpaper === "wave" ||
      raw.wallpaper === "linen" ||
      raw.wallpaper === "aurora" ||
      raw.wallpaper === "leather"
        ? raw.wallpaper
        : base.wallpaper,
    lockScreenEnabled:
      typeof raw.lockScreenEnabled === "boolean" ? raw.lockScreenEnabled : base.lockScreenEnabled,
    rememberUnlockState:
      typeof raw.rememberUnlockState === "boolean"
        ? raw.rememberUnlockState
        : base.rememberUnlockState,
    showStatusBar: statusBarMode !== "off",
    statusBarMode,
    lightThemeContent:
      typeof raw.lightThemeContent === "boolean" ? raw.lightThemeContent : base.lightThemeContent,
    showBadges: typeof raw.showBadges === "boolean" ? raw.showBadges : base.showBadges,
    showSpotlight: typeof raw.showSpotlight === "boolean" ? raw.showSpotlight : base.showSpotlight,
    desktopMode:
      raw.desktopMode === "ipad" || raw.desktopMode === "iphone"
        ? raw.desktopMode
        : base.desktopMode,
  }
}

export const ios6Store = defineStore({
  init: createDefaultIos6State,
  persist: {
    key: "preferences",
    mode: "local",
    version: 2,
    migrate(persisted) {
      return migrateIos6StoreState(persisted)
    },
  },
  actions: {
    setWallpaper(ctx, wallpaper: Ios6WallpaperId) {
      ctx.set((prev) => ({ ...prev, wallpaper }))
    },
    setLockScreenEnabled(ctx, lockScreenEnabled: boolean) {
      ctx.set((prev) => ({ ...prev, lockScreenEnabled }))
    },
    setRememberUnlockState(ctx, rememberUnlockState: boolean) {
      ctx.set((prev) => ({ ...prev, rememberUnlockState }))
    },
    setShowStatusBar(ctx, showStatusBar: boolean) {
      ctx.set((prev) => ({
        ...prev,
        showStatusBar,
        statusBarMode: showStatusBar ? "always" : "off",
      }))
    },
    setStatusBarMode(ctx, statusBarMode: Ios6StatusBarMode) {
      ctx.set((prev) => ({
        ...prev,
        statusBarMode,
        showStatusBar: statusBarMode !== "off",
      }))
    },
    setLightThemeContent(ctx, lightThemeContent: boolean) {
      ctx.set((prev) => ({ ...prev, lightThemeContent }))
    },
    setShowBadges(ctx, showBadges: boolean) {
      ctx.set((prev) => ({ ...prev, showBadges }))
    },
    setShowSpotlight(ctx, showSpotlight: boolean) {
      ctx.set((prev) => ({ ...prev, showSpotlight }))
    },
    setDesktopMode(ctx, desktopMode: Ios6DesktopMode) {
      ctx.set((prev) => ({ ...prev, desktopMode }))
    },
  },
})

export type Ios6StoreInstance = ReturnType<typeof ios6Store.create>
