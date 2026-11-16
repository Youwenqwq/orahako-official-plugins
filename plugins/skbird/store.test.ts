import { describe, expect, it, vi } from "vitest"
import type { PluginHttpService } from "@orahako/plugin-sdk"
import { getSkbirdStore, initSkbirdStore, SKBIRD_STORAGE_KEY } from "./store"

const storage = {
  getItem: vi.fn(async (_key: string) => null as string | null),
  setItem: vi.fn(async (_key: string, _value: string) => undefined),
  removeItem: vi.fn(async (_key: string) => undefined),
}

const http: PluginHttpService = {
  send: vi.fn(),
  activity: {
    getSnapshot: () => ({ active: [], history: [], session: null, revision: 0 }),
    subscribe: () => () => {},
    registerLabeler: () => () => {},
  },
}

describe("Skbird credential persistence", () => {
  it("rehydrates and writes through the injected secure storage with the plugin-owned key", async () => {
    initSkbirdStore({ http, storage })
    await vi.waitFor(() => expect(getSkbirdStore().getState().hasHydrated).toBe(true))

    expect(SKBIRD_STORAGE_KEY.length).toBeGreaterThan(0)
    expect(storage.getItem).toHaveBeenCalledWith(SKBIRD_STORAGE_KEY)

    getSkbirdStore().getState().setConfig({
      token: " TOKEN ",
      deviceId: "",
      alias: " ysu ",
    })
    await vi.waitFor(() =>
      expect(storage.setItem).toHaveBeenCalledWith(SKBIRD_STORAGE_KEY, expect.any(String))
    )

    const serialized = storage.setItem.mock.calls.at(-1)![1]
    const saved = JSON.parse(serialized) as { state: Record<string, unknown> }
    expect(saved.state).toMatchObject({
      token: "TOKEN",
      alias: "ysu",
      deviceId: expect.stringMatching(/^[0-9a-f-]+$/),
    })
    expect(saved.state).not.toHaveProperty("unreadCount")
  })
})
