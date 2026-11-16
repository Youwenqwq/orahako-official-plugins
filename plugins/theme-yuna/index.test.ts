import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PluginContext, PluginThemeDefinition } from "@orahako/plugin-sdk"

vi.mock("@orahako/plugin-sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@orahako/plugin-sdk")>()),
  validatePluginManifest: (value: unknown) => value,
}))

import definition from "./index"

describe("community.theme.yuna", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("registers all themes through the public UI and asset services", async () => {
    const registered: PluginThemeDefinition[] = []
    const ctx = {
      ui: {
        registerTheme: vi.fn((theme: PluginThemeDefinition) => {
          registered.push(theme)
        }),
      },
      assets: { url: (path: string) => `blob:${path}` },
    } as unknown as PluginContext

    await definition(ctx)

    expect(registered.map((theme) => theme.id)).toEqual(["102", "arknights", "scarlet"])
    expect(registered.every((theme) => theme.css.includes("blob:"))).toBe(true)
  })
})
