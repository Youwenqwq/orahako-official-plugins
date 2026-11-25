import { describe, expect, it } from "vitest"
import type { PluginKeyValueStorage } from "@orahako/sdk"
import { createPerlicaSnapshotCache, type PerlicaSnapshot } from "./cache"

function createStorage(initial?: Record<string, string>) {
  const values = new Map<string, string>(Object.entries(initial ?? {}))
  const storage: PluginKeyValueStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value)
    },
    removeItem: async (key) => {
      values.delete(key)
    },
  }
  return { storage, values }
}

function snapshotKey(accountId: string) {
  return `snapshot:${encodeURIComponent(accountId)}`
}

describe("Perlica snapshot cache", () => {
  it("round-trips snapshots through the injected plugin storage", async () => {
    const { storage, values } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)

    await cache.write("1001", { center: { lat: 39.9, lng: 119.6 }, machinesAt: 42 })

    const stored = await cache.read("1001")
    expect(stored).toMatchObject({
      center: { lat: 39.9, lng: 119.6 },
      machinesAt: 42,
      machines: [],
      logs: [],
      cards: [],
    })
    expect(stored?.savedAt).toBeGreaterThan(0)
    expect([...values.keys()]).toEqual([snapshotKey("1001")])
  })

  it("keeps accounts isolated inside the plugin namespace", async () => {
    const { storage } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)

    await cache.write("1001", { machinesAt: 1 })
    await cache.write("2002", { machinesAt: 2 })

    expect((await cache.read("1001"))?.machinesAt).toBe(1)
    expect((await cache.read("2002"))?.machinesAt).toBe(2)
    expect(await cache.read("3003")).toBeNull()
  })

  it("serializes concurrent patches instead of losing an earlier write", async () => {
    const { storage } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)

    await Promise.all([
      cache.write("1001", { userAt: 10 }),
      cache.write("1001", { geoAreaAt: 20 }),
      cache.write("1001", { logsAt: 30 }),
    ])

    expect(await cache.read("1001")).toMatchObject({ userAt: 10, geoAreaAt: 20, logsAt: 30 })
  })

  it("drops expired snapshots and removes the stale entry", async () => {
    const { storage, values } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)
    const stale: PerlicaSnapshot = {
      savedAt: Date.now() - 13 * 60 * 60 * 1000,
      center: null,
      machines: [],
      machinesAt: 0,
      user: null,
      userAt: 0,
      logs: [],
      logsAt: 0,
      cards: [],
      cardsAt: 0,
      geoArea: null,
      geoAreaAt: 0,
    }
    values.set(snapshotKey("1001"), JSON.stringify(stale))

    expect(await cache.read("1001")).toBeNull()
    expect(values.has(snapshotKey("1001"))).toBe(false)
  })

  it("redacts credential-shaped keys and token strings before persisting", async () => {
    const { storage, values } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)

    await cache.write("1001", {
      user: { nickname: "TOKEN:secret-value", token: "raw" } as never,
    })

    const raw = values.get(snapshotKey("1001")) ?? ""
    expect(raw).not.toContain("secret-value")
    expect(raw).not.toContain('"token"')
    expect(raw).toContain("[redacted]")
  })

  it("clears only the requested account and tolerates storage denial", async () => {
    const { storage, values } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)
    await cache.write("1001", { machinesAt: 1 })
    await cache.write("2002", { machinesAt: 2 })

    await cache.clear("1001")
    expect(values.has(snapshotKey("1001"))).toBe(false)
    expect(values.has(snapshotKey("2002"))).toBe(true)

    const denied = createPerlicaSnapshotCache({
      getItem: async () => null,
      setItem: async () => {
        throw new Error("denied")
      },
      removeItem: async () => {
        throw new Error("denied")
      },
    })
    await expect(denied.write("1001", { machinesAt: 1 })).resolves.toBeUndefined()
    await expect(denied.clear("1001")).resolves.toBeUndefined()
    expect(await denied.read("1001")).toBeNull()
  })

  it("never restores an active order from a legacy snapshot", async () => {
    const { storage, values } = createStorage()
    const cache = createPerlicaSnapshotCache(storage)
    values.set(
      snapshotKey("1001"),
      JSON.stringify({
        savedAt: Date.now(),
        order: { orderNo: "ORDER-1", userCode: "80369677", status: "riding" },
        orderAt: Date.now(),
      })
    )

    const stored = await cache.read("1001")
    expect(stored).not.toBeNull()
    expect(stored).not.toHaveProperty("order")
    expect(stored).not.toHaveProperty("orderAt")
  })

  it("ignores malformed payloads", async () => {
    const { storage } = createStorage({ [snapshotKey("1001")]: "not json" })
    const cache = createPerlicaSnapshotCache(storage)

    expect(await cache.read("1001")).toBeNull()
  })
})
