import { describe, expect, it, vi } from "vitest"
import type { PluginStorageService } from "@orahako/sdk"
import { createPerlicaStore, PERLICA_STORAGE_KEY } from "./store"

function createMemoryStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(PERLICA_STORAGE_KEY, initial)
  const setItem = vi.fn(async (key: string, value: string) => {
    values.set(key, value)
  })
  const backend = {
    getItem: async (key: string) => values.get(key) ?? null,
    setItem,
    removeItem: async (key: string) => {
      values.delete(key)
    },
  }
  const storage: PluginStorageService = { local: backend, secure: backend }
  return { values, setItem, storage }
}

function flush(): Promise<void> {
  return Promise.resolve().then(() => Promise.resolve())
}

describe("Perlica store scope", () => {
  it("hydrates credentials from the host-provided secure storage", async () => {
    const { storage } = createMemoryStorage(
      JSON.stringify({
        state: {
          token: "token-1",
          accountId: "10001",
          adAccountId: "77",
          center: { lat: 30.1, lng: 120.2 },
          radius: 5000,
        },
        version: 1,
      })
    )

    const store = createPerlicaStore(storage)
    try {
      await vi.waitFor(() => expect(store.hydrated.getSnapshot()).toBe(true))
      expect(store.source.getSnapshot()).toMatchObject({
        token: "token-1",
        accountId: "10001",
        adAccountId: "77",
        center: { lat: 30.1, lng: 120.2 },
        radius: 5000,
      })
    } finally {
      store.dispose()
    }
  })

  it("falls back to defaults for malformed stored state", async () => {
    const { storage } = createMemoryStorage("not json")
    const store = createPerlicaStore(storage)
    try {
      await vi.waitFor(() => expect(store.hydrated.getSnapshot()).toBe(true))
      expect(store.source.getSnapshot()).toMatchObject({
        token: "",
        accountId: "",
        adAccountId: "11423",
        radius: 3000,
      })
    } finally {
      store.dispose()
    }
  })

  it("persists credential changes under the plugin storage key", async () => {
    const { storage, setItem, values } = createMemoryStorage()
    const store = createPerlicaStore(storage)
    try {
      await vi.waitFor(() => expect(store.hydrated.getSnapshot()).toBe(true))
      store.actions.login({ token: " token-2 ", accountId: "10002" })

      await vi.waitFor(() => expect(setItem).toHaveBeenCalled())
      expect(setItem.mock.calls[0]![0]).toBe(PERLICA_STORAGE_KEY)
      expect(JSON.parse(values.get(PERLICA_STORAGE_KEY)!)).toMatchObject({
        state: { token: "token-2", accountId: "10002", adAccountId: "11423" },
        version: 1,
      })
    } finally {
      store.dispose()
    }
  })

  it("stops persisting after dispose", async () => {
    const { storage, setItem } = createMemoryStorage()
    const store = createPerlicaStore(storage)
    await vi.waitFor(() => expect(store.hydrated.getSnapshot()).toBe(true))
    store.dispose()
    await flush()
    setItem.mockClear()

    store.actions.login({ token: "token-3", accountId: "10003" })
    await flush()
    expect(setItem).not.toHaveBeenCalled()
  })
})
