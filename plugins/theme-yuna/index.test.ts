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
    expect(manifest.version).toBe("1.2.2")
    expect(manifest.apiVersion).toBe(PLUGIN_API_VERSION)
    expect(manifest.kind).toBe("theme")
    expect(manifest.minAppVersion).toBeUndefined()
    expect(manifest.providerIndependent).toBe(true)
    expect(manifest.inject).toEqual(["ui", "assets"])
    expect(manifest.entry).toBe("dist/index.js")
    expect(definition.inject).toEqual(["ui", "assets"])
  })

  it("registers all four themes with 2026-11-27 mobile design spec rules", async () => {
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
      // Mobile ergonomics & hover isolation (#mobile spec)
      expect(theme.css).toContain("@media (hover: hover)")
      expect(theme.css).toContain("@media (pointer: coarse)")
      expect(theme.css).toContain("@media (max-width: 700px)")
      expect(theme.css).toContain("@media (max-width: 480px)")
      expect(theme.css).toContain("font-size: max(16px, 1rem);")
      expect(theme.css).toContain("font-size: max(11px, 0.6875rem);")
      expect(theme.css).toContain("env(safe-area-inset-top, 0px)")
      expect(theme.css).toContain("env(safe-area-inset-bottom, 0px)")
      expect(theme.css).toContain("100dvh")
      expect(theme.css).toContain("scroll-snap-type: x proximity;")
      // Solid default badges must keep primary-foreground contrast and never get accent-on-primary overrides
      expect(theme.css).toContain('html [data-slot="badge"][data-variant="default"]')
      expect(theme.css).toContain("color: var(--primary-foreground);")
      expect(theme.css).toContain('html [data-slot="badge"]:is([data-variant="secondary"], [data-variant="outline"])')
      expect(theme.css).not.toContain('[data-slot="badge"]:not([data-variant="destructive"])')
    }

    // 102: blue + pink + category bottom strips, mobile shadow convergence
    const skin102 = registered.find((theme) => theme.id === "102")!
    expect(skin102.css).toContain("--yuna-card-accent: var(--yuna-pink);")
    expect(skin102.css).toContain("box-shadow: 2px 2px 0 var(--secondary);")
    expect(skin102.css).toContain("box-shadow: inset 0 3px 0 var(--yuna-pink);")

    // Arknights: 4-color tactical cycling top strip (never single cyan) + pink headers + highlight/lime
    const arknights = registered.find((theme) => theme.id === "arknights")!
    expect(arknights.css).toContain("--yuna-bg: #11161a;")
    expect(arknights.css).toContain("--yuna-pink: #f4c63d;")
    expect(arknights.css).toContain(":nth-of-type(4n + 2) { --ark-card-accent: var(--yuna-ark-accent-amber); }")
    expect(arknights.css).toContain(":nth-of-type(4n + 3) { --ark-card-accent: var(--yuna-ark-accent-lime); }")
    expect(arknights.css).toContain(":nth-of-type(4n) { --ark-card-accent: var(--yuna-ark-highlight); }")
    expect(arknights.css).toContain("color: var(--ark-card-accent);")
    expect(arknights.css).toContain("background: var(--yuna-ark-highlight);")

    // Scarlet: wine + antique gold + visible crimson/gold gradient + mobile frame convergence
    const scarlet = registered.find((theme) => theme.id === "scarlet")!
    expect(scarlet.css).toContain("--yuna-bg: #2b1019;")
    expect(scarlet.css).toContain("--yuna-pink: #926229;")
    expect(scarlet.css).toContain("--yuna-pink: #dfbe82;")
    expect(scarlet.css).toContain("linear-gradient(155deg, #431727 0%, #2b1019 48%, #1e0a12 100%)")
    expect(scarlet.css).toContain("background-attachment: fixed;")
    expect(scarlet.css).toContain("inset 0 0 0 2px var(--card)")

    // Scarlet 2.0: crimson + royal gold + sakuya silver icons/ticks + wax-seal badges + visible gradient
    const scarlet2 = registered.find((theme) => theme.id === "scarlet2")!
    expect(scarlet2.css).toContain("--yuna-bg: #f4ece4;")
    expect(scarlet2.css).toContain("--yuna-bg: #16070d;")
    expect(scarlet2.css).toContain("--yuna-sakuya-silver: #4a6078;")
    expect(scarlet2.css).toContain("--yuna-remilia-crimson: #e34b6f;")
    expect(scarlet2.css).toContain("--yuna-s2-velvet: #290b16;")
    expect(scarlet2.css).toContain("linear-gradient(160deg, #2d0d1a 0%, #190810 50%, #100409 100%)")
    expect(scarlet2.css).toContain("color: var(--yuna-sakuya-silver);")
    expect(scarlet2.css).toContain("inset 0 2px 0 var(--yuna-remilia-crimson), inset 0 4px 0 var(--yuna-scarlet-gold)")

    dispose()
    expect(registered).toEqual([])
  })
})
