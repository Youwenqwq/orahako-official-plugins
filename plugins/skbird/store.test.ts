import { describe, expect, it, vi } from "vitest"
import type { PluginStorageService } from "@orahako/sdk"
import { SKBIRD_STORAGE_KEY, skbirdConfigStore } from "./store"

function createStorage(initial: string | null = null) {
  const values = new Map<string, string>()
  if (initial !== null) values.set(SKBIRD_STORAGE_KEY, initial)
  const keyValue = {
    getItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn(async (key: string) => {
      values.delete(key)
    }),
  }
  const storage: PluginStorageService = { local: keyValue, secure: keyValue }
  return { storage, keyValue }
}

describe("Skbird credential persistence", () => {
  it("rehydrates and writes through the injected secure storage with the plugin-owned key", async () => {
    const { storage, keyValue } = createStorage()
    const instance = skbirdConfigStore.create(storage)
    await vi.waitFor(() => expect(instance.hydrated.getSnapshot()).toBe(true))

    expect(SKBIRD_STORAGE_KEY.length).toBeGreaterThan(0)
    expect(keyValue.getItem).toHaveBeenCalledWith(SKBIRD_STORAGE_KEY)

    instance.actions.setConfig({
      token: " TOKEN ",
      deviceId: "",
      alias: " ysu ",
    })
    await vi.waitFor(() =>
      expect(keyValue.setItem).toHaveBeenCalledWith(SKBIRD_STORAGE_KEY, expect.any(String))
    )

    const saved = JSON.parse(keyValue.setItem.mock.calls.at(-1)![1]) as {
      version: number
      state: Record<string, unknown>
    }
    expect(saved.version).toBe(1)
    expect(saved.state).toMatchObject({
      token: "TOKEN",
      alias: "ysu",
      deviceId: expect.stringMatching(/^[0-9a-f-]+$/),
    })
    expect(saved.state).not.toHaveProperty("unreadCount")
    instance.dispose()
  })

})
