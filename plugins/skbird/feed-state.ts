import type { SkbirdThread } from "./types"

export type SkbirdFeedTab = "hot" | "latest" | "top" | "reward"

/**
 * Identity of the account that owns a feed snapshot. Token, deviceId and alias
 * all affect which posts the server returns, so every field is part of the
 * identity. Instances live only in plugin session memory; they are never put
 * into a snapshot payload or host storage, which keeps credentials out of the
 * feed-state slot.
 */
export interface SkbirdFeedIdentity {
  readonly token: string
  readonly deviceId: string
  readonly alias: string
}

export function sameSkbirdFeedIdentity(
  a: SkbirdFeedIdentity | null,
  b: SkbirdFeedIdentity | null
): boolean {
  if (a === null || b === null) return a === b
  return a.token === b.token && a.deviceId === b.deviceId && a.alias === b.alias
}

export interface SkbirdFeedSnapshot {
  version: 1
  tab: SkbirdFeedTab
  wd: string
  submittedWd: string
  cateId: string
  range: string
  threads: SkbirdThread[]
  hasMore: boolean
  cursor: string
  searchPage: number
  searchOpen: boolean
  scrollY: number
  mainScrollTop: number
}

/**
 * Backing slot for the session-scoped feed state. The host storage service has
 * no session adapter, so the default is a plugin-local in-memory slot: state
 * survives page navigation within one plugin activation and is dropped when
 * the app reloads or the plugin is disposed. Nothing is written to host
 * globals, so no key can collide with another plugin.
 */
export interface SkbirdFeedStateStorage {
  getItem(): string | null
  setItem(value: string): void
}

function createMemorySessionStorage(): SkbirdFeedStateStorage {
  let value: string | null = null
  return {
    getItem: () => value,
    setItem: (next) => {
      value = next
    },
  }
}

export interface SkbirdFeedStateStore {
  /**
   * Returns the stored snapshot only when it was written by `identity`.
   * A different account always reads `null`, so the list falls back to its
   * normal first-screen fetch instead of restoring another account's posts.
   */
  read(identity: SkbirdFeedIdentity): SkbirdFeedSnapshot | null
  write(identity: SkbirdFeedIdentity, snapshot: SkbirdFeedSnapshot): void
}

function isFeedTab(value: unknown): value is SkbirdFeedTab {
  return value === "hot" || value === "latest" || value === "top" || value === "reward"
}
function isThread(value: unknown): value is SkbirdThread {
  if (value === null || typeof value !== "object") return false
  const thread = value as Partial<SkbirdThread>
  return typeof thread.threadId === "string" && Array.isArray(thread.imgPaths)
}

function isSnapshot(value: unknown): value is SkbirdFeedSnapshot {
  if (value === null || typeof value !== "object") return false
  const snapshot = value as Partial<SkbirdFeedSnapshot>
  return (
    snapshot.version === 1 &&
    isFeedTab(snapshot.tab) &&
    typeof snapshot.wd === "string" &&
    typeof snapshot.submittedWd === "string" &&
    typeof snapshot.cateId === "string" &&
    typeof snapshot.range === "string" &&
    Array.isArray(snapshot.threads) &&
    snapshot.threads.every(isThread) &&
    typeof snapshot.hasMore === "boolean" &&
    typeof snapshot.cursor === "string" &&
    typeof snapshot.searchPage === "number" &&
    Number.isFinite(snapshot.searchPage) &&
    typeof snapshot.searchOpen === "boolean" &&
    typeof snapshot.scrollY === "number" &&
    Number.isFinite(snapshot.scrollY) &&
    typeof snapshot.mainScrollTop === "number" &&
    Number.isFinite(snapshot.mainScrollTop)
  )
}

export function createSkbirdFeedStateStore(
  storage: SkbirdFeedStateStorage = createMemorySessionStorage()
): SkbirdFeedStateStore {
  let storedIdentity: SkbirdFeedIdentity | null = null
  return {
    read(identity) {
      if (!sameSkbirdFeedIdentity(storedIdentity, identity)) return null
      try {
        const raw = storage.getItem()
        if (!raw) return null
        const value: unknown = JSON.parse(raw)
        return isSnapshot(value) ? value : null
      } catch {
        return null
      }
    },
    write(identity, snapshot) {
      try {
        storage.setItem(JSON.stringify(snapshot))
        // Bind the slot to the writer only after the payload landed, so a
        // failed write never exposes the previous account's snapshot.
        storedIdentity = identity
      } catch {
        // A failed session write must not block list navigation.
      }
    },
  }
}
