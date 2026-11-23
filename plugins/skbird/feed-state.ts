import type { SkbirdThread } from "./types"

export type SkbirdFeedTab = "hot" | "latest" | "top" | "reward"

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
  read(): SkbirdFeedSnapshot | null
  write(snapshot: SkbirdFeedSnapshot): void
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
  return {
    read() {
      try {
        const raw = storage.getItem()
        if (!raw) return null
        const value: unknown = JSON.parse(raw)
        return isSnapshot(value) ? value : null
      } catch {
        return null
      }
    },
    write(snapshot) {
      try {
        storage.setItem(JSON.stringify(snapshot))
      } catch {
        // A failed session write must not block list navigation.
      }
    },
  }
}

/**
 * Session-only store shared by the plugin's list and detail pages. The plugin
 * creates one instance in `apply`, so filters, loaded threads, pagination
 * cursors and scroll offsets survive page navigation within one activation and
 * are dropped when the plugin is disposed or the app reloads.
 */
