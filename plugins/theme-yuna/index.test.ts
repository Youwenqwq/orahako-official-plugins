import { describe, expect, it, vi } from "vitest"
import { PLUGIN_API_VERSION, type PluginThemeDefinition } from "@orahako/sdk"
import definition, { manifest } from "./index"

type ApplyContext = Parameters<typeof definition.apply>[0]

function createContext() {
  const registered: PluginThemeDefinition[] = []
  const disposers: (() => void)[] = []

  const ctx = {
    ui: {
      registerTheme: vi.fn((theme: PluginThemeDefinition) => {
        registered.push(theme)
        const dispose = () => {
          const index = registered.indexOf(theme)
          if (index >= 0) registered.splice(index, 1)
        }
        disposers.push(dispose)
        return dispose
      }),
    },
    assets: { url: (path: string) => `blob:${path}` },
  } as unknown as ApplyContext

  return {
    ctx,
    registered,
    dispose: () => {
      for (const dispose of disposers.splice(0).reverse()) dispose()
    },
  }
}

describe("community.theme.yuna", () => {
  it("declares an API v1 theme manifest", () => {
    expect(manifest.id).toBe("community.theme.yuna")
    expect(manifest.version).toBe("1.0.0")
    expect(manifest.apiVersion).toBe(PLUGIN_API_VERSION)
    expect(manifest.kind).toBe("theme")
    expect(manifest.inject).toEqual(["ui", "assets"])
    expect(manifest.entry).toBe("dist/index.js")
    expect(definition.inject).toEqual(["ui", "assets"])
  })

  it("registers all themes from apply through the public UI and asset services", async () => {
    const { ctx, registered, dispose } = createContext()

    expect(registered).toEqual([])

    await definition.apply(ctx)

    expect(registered.map((theme) => theme.id)).toEqual(["102", "arknights", "scarlet"])
    expect(registered.map((theme) => theme.name)).toEqual([
      "YUNA · 102",
      "YUNA · 明日方舟",
      "YUNA · 红魔馆",
    ])
    expect(registered.every((theme) => theme.css.includes("blob:assets/fonts/"))).toBe(true)

    dispose()
    expect(registered).toEqual([])
  })
})
