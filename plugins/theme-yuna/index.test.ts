import { describe, expect, it, vi } from "vitest"
import postcss from "postcss"
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
    expect(manifest.version).toBe("1.1.0")
    expect(manifest.apiVersion).toBe(PLUGIN_API_VERSION)
    expect(manifest.kind).toBe("theme")
    expect(manifest.minAppVersion).toBeUndefined()
    expect(manifest.providerIndependent).toBe(true)
    expect(manifest.inject).toEqual(["ui", "assets"])
    expect(manifest.entry).toBe("dist/index.js")
    expect(definition.inject).toEqual(["ui", "assets"])
  })

  it("registers all four themes including scarlet2 from apply through the public UI and asset services", async () => {
    const { ctx, registered, dispose } = createContext()

    expect(registered).toEqual([])

    await definition.apply(ctx)

    expect(registered.map((theme) => theme.id)).toEqual(["102", "arknights", "scarlet", "scarlet2"])
    expect(registered.map((theme) => theme.name)).toEqual([
      "YUNA · 102",
      "YUNA · 明日方舟",
      "YUNA · 红魔馆",
      "YUNA · 红魔馆 2.0",
    ])
    expect(registered.every((theme) => theme.css.includes("blob:assets/fonts/"))).toBe(true)

    for (const theme of registered) {
      expect(() => postcss.parse(theme.css)).not.toThrow()
      expect(theme.css).toContain("html:not(.dark)")
      expect(theme.css).toContain("html.dark")
    }

    const arknights = registered.find((theme) => theme.id === "arknights")!
    expect(arknights.css).toContain("--yuna-bg: #11161a;")
    expect(arknights.css).toContain("--yuna-pink: #f4c63d;")

    const scarlet = registered.find((theme) => theme.id === "scarlet")!
    expect(scarlet.css).toContain("--yuna-pink: #926229;")
    expect(scarlet.css).toContain("--yuna-pink: #dfbe82;")

    const scarlet2 = registered.find((theme) => theme.id === "scarlet2")!
    expect(scarlet2.css).toContain("--yuna-bg: #f4ece4;")
    expect(scarlet2.css).toContain("--yuna-bg: #0e0509;")
    expect(scarlet2.css).toContain("--yuna-sakuya-silver: #4a6078;")
    expect(scarlet2.css).toContain("--yuna-remilia-crimson: #e34b6f;")
    expect(scarlet2.css).toContain("--yuna-s2-velvet: #220812;")

    dispose()
    expect(registered).toEqual([])
  })
})
