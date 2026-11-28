import { defineStore } from "@orahako/sdk"

export type Ios6WallpaperId = "droplets" | "wave" | "linen" | "aurora" | "leather"

export type Ios6DesktopMode = "ipad" | "iphone"

export interface Ios6StoreState {
  readonly wallpaper: Ios6WallpaperId
  readonly lockScreenEnabled: boolean
  readonly rememberUnlockState: boolean
  readonly showStatusBar: boolean
  readonly showBadges: boolean
  readonly showSpotlight: boolean
  readonly desktopMode: Ios6DesktopMode
}

export type Ios6ShellState = Ios6StoreState

export const ios6Store = defineStore({
  init: (): Ios6StoreState => ({
    wallpaper: "droplets",
    lockScreenEnabled: true,
    rememberUnlockState: true,
    showStatusBar: true,
    showBadges: true,
    showSpotlight: true,
    desktopMode: "ipad",
  }),
  persist: {
    key: "preferences",
    mode: "local",
    version: 1,
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
      ctx.set((prev) => ({ ...prev, showStatusBar }))
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
