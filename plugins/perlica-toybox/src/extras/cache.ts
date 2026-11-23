import type { PluginKeyValueStorage } from "@orahako/sdk"
import type {
  PerlicaCoords,
  PerlicaGeoArea,
  PerlicaMachine,
  PerlicaOrder,
  PerlicaRideCard,
  PerlicaRideLog,
  PerlicaUserInfo,
} from "./types"

/**
 * Snapshot key prefix. The host already namespaces every plugin key, so the
 * only remaining collision axis is the account inside this plugin.
 */
const SNAPSHOT_KEY_PREFIX = "snapshot"
const SNAPSHOT_TTL = 12 * 60 * 60 * 1000

function snapshotKey(accountId: string) {
  return `${SNAPSHOT_KEY_PREFIX}:${encodeURIComponent(accountId)}`
}

export interface PerlicaSnapshot {
  savedAt: number
  center: PerlicaCoords | null
  machines: PerlicaMachine[]
  machinesAt: number
  user: PerlicaUserInfo | null
  userAt: number
  order: PerlicaOrder | null
  orderAt: number
  logs: PerlicaRideLog[]
  logsAt: number
  cards: PerlicaRideCard[]
  cardsAt: number
  geoArea: PerlicaGeoArea | null
  geoAreaAt: number
}

const EMPTY_SNAPSHOT: PerlicaSnapshot = {
  savedAt: 0,
  center: null,
  machines: [],
  machinesAt: 0,
  user: null,
  userAt: 0,
  order: null,
  orderAt: 0,
  logs: [],
  logsAt: 0,
  cards: [],
  cardsAt: 0,
  geoArea: null,
  geoAreaAt: 0,
}

/**
 * Per-activation snapshot cache. Reads and writes go through the injected
 * plugin storage (`ctx.storage.local`), which the host scopes to this plugin,
 * so snapshots never touch host globals or another plugin's keys.
 *
 * The snapshot is a local-lifetime cache: it survives app restarts for
 * `SNAPSHOT_TTL` and is dropped as soon as it goes stale. Writes are
 * serialized per account so concurrent request results cannot lose earlier
 * patches through a read-modify-write race.
 */
export interface PerlicaSnapshotCache {
  read(accountId: string): Promise<PerlicaSnapshot | null>
  write(accountId: string, patch: Partial<PerlicaSnapshot>): Promise<void>
  clear(accountId: string): Promise<void>
}

function normalizeSnapshot(value: Partial<PerlicaSnapshot>): PerlicaSnapshot {
  return {
    ...EMPTY_SNAPSHOT,
    ...value,
    machines: Array.isArray(value.machines) ? value.machines : [],
    logs: Array.isArray(value.logs) ? value.logs : [],
    cards: Array.isArray(value.cards) ? value.cards : [],
  }
}

function sanitizeSnapshot(snapshot: PerlicaSnapshot): string {
  return JSON.stringify(snapshot, (key, value: unknown) => {
    if (/token|authorization|cookie|credential|secret|password|session/i.test(key)) {
      return undefined
    }
    if (typeof value === "string") return value.replace(/TOKEN:[^\s&?#]+/gi, "[redacted]")
    return value
  })
}

export function createPerlicaSnapshotCache(storage: PluginKeyValueStorage): PerlicaSnapshotCache {
  const pending = new Map<string, Promise<unknown>>()

  /** Runs storage work for one account strictly after earlier work finished. */
  function enqueue<T>(accountId: string, task: () => Promise<T>): Promise<T> {
    const previous = pending.get(accountId) ?? Promise.resolve()
    const next = previous.then(task, task)
    pending.set(accountId, next)
    const settle = () => {
      if (pending.get(accountId) === next) pending.delete(accountId)
    }
    void next.then(settle, settle)
    return next
  }

  async function readNow(accountId: string): Promise<PerlicaSnapshot | null> {
    const key = snapshotKey(accountId)
    try {
      const raw = await storage.getItem(key)
      if (!raw) return null
      const value = JSON.parse(raw) as Partial<PerlicaSnapshot>
      if (typeof value.savedAt !== "number" || Date.now() - value.savedAt > SNAPSHOT_TTL) {
        await storage.removeItem(key).catch(() => undefined)
        return null
      }
      return normalizeSnapshot(value)
    } catch {
      return null
    }
  }

  async function writeNow(accountId: string, patch: Partial<PerlicaSnapshot>): Promise<void> {
    try {
      const previous = (await readNow(accountId)) ?? EMPTY_SNAPSHOT
      const next = { ...previous, ...patch, savedAt: Date.now() }
      await storage.setItem(snapshotKey(accountId), sanitizeSnapshot(next))
    } catch {
      // Storage denial must not block live requests.
    }
  }

  return {
    read: (accountId) => enqueue(accountId, () => readNow(accountId)),
    write: (accountId, patch) => enqueue(accountId, () => writeNow(accountId, patch)),
    clear: (accountId) =>
      enqueue(accountId, async () => {
        try {
          await storage.removeItem(snapshotKey(accountId))
        } catch {
          // Storage denial needs no user-facing error.
        }
      }),
  }
}
