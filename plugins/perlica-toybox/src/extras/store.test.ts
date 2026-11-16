import { describe, expect, it, vi } from "vitest"
import type { PluginHttpService } from "@orahako/plugin-sdk"
import { createPerlicaStore, PERLICA_STORAGE_KEY } from "./store"

const http: PluginHttpService = {
  send: async () => {
    throw new Error("not used")
  },
  activity: {
    getSnapshot: () => ({ active: [], history: [], session: null, revision: 0 }),
    subscribe: () => () => {},
    registerLabeler: () => () => {},
  },
}

function createMemoryStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(PERLICA_STORAGE_KEY, initial)
  const setItem = vi.fn(async (key: string, value: string) => {
    values.set(key, value)
  })
  return {
    values,
    setItem,
    storage: {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem,
      removeItem: async (key: string) => {
        values.delete(key)
      },
    },
  }
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
        version: 0,
      })
    )

    const store = await createPerlicaStore({ http, storage })
    try {
      expect(store.api.getState()).toMatchObject({
        token: "token-1",
        accountId: "10001",
        adAccountId: "77",
        center: { lat: 30.1, lng: 120.2 },
        radius: 5000,
        hasHydrated: true,
      })
      expect(store.getClient()).not.toBeNull()
    } finally {
      await store.dispose()
    }
  })

  it("falls back to defaults for malformed stored state", async () => {
    const { storage } = createMemoryStorage("not json")
    const store = await createPerlicaStore({ http, storage })
    try {
      expect(store.api.getState()).toMatchObject({
        token: "",
        accountId: "",
        adAccountId: "11423",
        radius: 3000,
        hasHydrated: true,
      })
      expect(store.getClient()).toBeNull()
    } finally {
      await store.dispose()
    }
  })

  it("persists credential changes under the plugin storage key and flushes on dispose", async () => {
    const { storage, setItem, values } = createMemoryStorage()
    const store = await createPerlicaStore({ http, storage })
    store.api.getState().login({ token: " token-2 ", accountId: "10002" })
    await store.dispose()

    expect(setItem).toHaveBeenCalled()
    expect(setItem.mock.calls[0]![0]).toBe(PERLICA_STORAGE_KEY)
    expect(JSON.parse(values.get(PERLICA_STORAGE_KEY)!)).toMatchObject({
      state: { token: "token-2", accountId: "10002", adAccountId: "11423" },
      version: 0,
    })
  })

  it("stops persisting after dispose", async () => {
    const { storage, setItem } = createMemoryStorage()
    const store = await createPerlicaStore({ http, storage })
    await store.dispose()
    setItem.mockClear()

    store.api.getState().login({ token: "token-3", accountId: "10003" })
    await Promise.resolve()
    expect(setItem).not.toHaveBeenCalled()
  })
})
