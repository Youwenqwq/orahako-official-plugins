import { describe, expect, it } from "vitest"
import type { PluginStorageService } from "@orahako/sdk"
import { chargeAuthStore, chargeDataStore } from "./store"

function createMemoryStorage(): PluginStorageService {
  const local = new Map<string, string>()
  const secure = new Map<string, string>()
  return {
    local: {
      getItem: async (key) => local.get(key) ?? null,
      setItem: async (key, value) => {
        local.set(key, value)
      },
      removeItem: async (key) => {
        local.delete(key)
      },
    },
    secure: {
      getItem: async (key) => secure.get(key) ?? null,
      setItem: async (key, value) => {
        secure.set(key, value)
      },
      removeItem: async (key) => {
        secure.delete(key)
      },
    },
  }
}

describe("campus-charge stores", () => {
  it("normalizes and clears personal jwt-token", () => {
    const store = chargeAuthStore.create(createMemoryStorage())
    store.actions.setToken("  jwt-token: sample.jwt.token  ")
    expect(store.source.getSnapshot().token).toBe("sample.jwt.token")
    store.actions.clearToken()
    expect(store.source.getSnapshot().token).toBe("")
    store.dispose()
  })

  it("toggles favorites and saves/removes port notes", () => {
    const store = chargeDataStore.create(createMemoryStorage())
    store.actions.toggleFavorite("G6177010")
    expect(store.source.getSnapshot().favorites).toEqual(["G6177010"])
    store.actions.toggleFavorite("G6177010")
    expect(store.source.getSnapshot().favorites).toEqual([])

    store.actions.savePortNote({
      code: "G6177010",
      port: "3",
      usability: "bad",
      note: "  插头松动  ",
    })
    expect(store.source.getSnapshot().notes["G6177010:3"]?.note).toBe("插头松动")
    expect(store.source.getSnapshot().notes["G6177010:3"]?.usability).toBe("bad")

    store.actions.savePortNote({
      code: "G6177010",
      port: "3",
      usability: "unknown",
      note: "   ",
    })
    expect(store.source.getSnapshot().notes["G6177010:3"]).toBeUndefined()
    store.dispose()
  })
})
