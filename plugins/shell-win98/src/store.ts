import { defineStore } from "@orahako/sdk"

export type Win98WallpaperId = "teal" | "clouds" | "grid" | "ocean" | "forest"

export type Win98SchemeId = "standard" | "rainy" | "rose" | "spruce" | "plum"

export interface Win98StoreState {
  readonly wallpaper: Win98WallpaperId
  readonly scheme: Win98SchemeId
  readonly explorerView: "icons" | "list"
}

export const win98Store = defineStore({
  init: (): Win98StoreState => ({
    wallpaper: "teal",
    scheme: "standard",
    explorerView: "icons",
  }),
  persist: {
    key: "desktop",
    mode: "local",
    version: 1,
  },
  actions: {
    setWallpaper(ctx, wallpaper: Win98WallpaperId) {
      ctx.set((prev) => ({ ...prev, wallpaper }))
    },
    setScheme(ctx, scheme: Win98SchemeId) {
      ctx.set((prev) => ({ ...prev, scheme }))
    },
    setExplorerView(ctx, explorerView: "icons" | "list") {
      ctx.set((prev) => ({ ...prev, explorerView }))
    },
  },
})

export type Win98StoreInstance = ReturnType<typeof win98Store.create>
