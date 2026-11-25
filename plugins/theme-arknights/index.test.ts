import { describe, expect, it, vi } from "vitest"
import { PLUGIN_API_VERSION, type PluginThemeDefinition } from "@orahako/sdk"
import definition, { manifest } from "./index"
import { arknightsThemeCss } from "./styles"

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
  } as unknown as ApplyContext

  return {
    ctx,
    registered,
    dispose: () => {
      for (const dispose of disposers.splice(0).reverse()) dispose()
    },
  }
}

describe("community.theme.arknights", () => {
  it("declares an API v1 theme manifest", () => {
    expect(manifest.id).toBe("community.theme.arknights")
    expect(manifest.version).toBe("1.0.1")
    expect(manifest.apiVersion).toBe(PLUGIN_API_VERSION)
    expect(manifest.kind).toBe("theme")
    expect(manifest.inject).toEqual(["ui"])
    expect(manifest.entry).toBe("dist/index.js")
    expect(definition.inject).toEqual(["ui"])
  })

  it("registers the theme from apply and releases it with the scope", async () => {
    const { ctx, registered, dispose } = createContext()

    expect(registered).toEqual([])

    await definition.apply(ctx)

    expect(registered).toEqual([
      {
        id: "arknights",
        name: "明日方舟 × 新粗野主义",
        css: arknightsThemeCss,
      },
    ])

    dispose()
    expect(registered).toEqual([])
  })
})
