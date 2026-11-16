import { createStore, type StoreApi } from "zustand/vanilla"
import { useStore } from "zustand"
import type { PluginHttpService, PluginKeyValueStorage } from "@orahako/plugin-sdk"
import { PerlicaClient, type PerlicaConfig } from "./client"
import { isUsableLatLng } from "./geo"
import type { PerlicaCoords } from "./types"

const DEFAULT_CENTER: PerlicaCoords = { lat: 39.93450164794922, lng: 119.61062622070312 }
const DEFAULT_AD_ACCOUNT_ID = "11423"
const DEFAULT_RADIUS = 3000
const MAX_RADIUS = 20000
const MIN_RADIUS = 200

/** Stored inside the host-provided per-plugin namespace (`ctx.storage.secure`). */
export const PERLICA_STORAGE_KEY = "credentials"

export interface PerlicaState {
  token: string
  accountId: string
  adAccountId: string
  center: PerlicaCoords
  locationConfirmed: boolean
  radius: number
  hasHydrated: boolean
  login: (config: PerlicaConfig) => void
  logout: () => void
  setCenter: (center: PerlicaCoords) => void
  setRadius: (radius: number) => void
}

export interface PerlicaStore {
  /** Raw Zustand api; pages observe it through `usePerlicaState`. */
  readonly api: StoreApi<PerlicaState>
  /** Builds a client from the current credential snapshot; null until configured. */
  getClient(): PerlicaClient | null
  /** Builds a client for credentials that are not stored yet, such as validation. */
  createClient(config: PerlicaConfig): PerlicaClient
  /**
   * Flushes pending persistence and detaches the store from the plugin scope.
   * The runtime calls this on Cordis disposal.
   */
  dispose(): Promise<void>
}

export interface PerlicaStoreOptions {
  http: PluginHttpService
  storage: PluginKeyValueStorage
}

type PersistedState = Pick<PerlicaState, "token" | "accountId" | "adAccountId" | "center" | "radius">

function clampRadius(value: number): number {
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, Math.round(value)))
}

function readPersisted(raw: string | null): Partial<PersistedState> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    const value =
      parsed !== null && typeof parsed === "object" && "state" in parsed ? parsed.state : parsed
    if (value === null || typeof value !== "object" || Array.isArray(value)) return {}
    const result: Partial<PersistedState> = {}
    if ("token" in value && typeof value.token === "string") result.token = value.token
    if ("accountId" in value && typeof value.accountId === "string") {
      result.accountId = value.accountId
    }
    if ("adAccountId" in value && typeof value.adAccountId === "string") {
      result.adAccountId = value.adAccountId
    }
    if ("radius" in value && typeof value.radius === "number" && Number.isFinite(value.radius)) {
      result.radius = clampRadius(value.radius)
    }
    if ("center" in value) {
      const center = value.center
      if (
        center !== null &&
        typeof center === "object" &&
        !Array.isArray(center) &&
        "lat" in center &&
        "lng" in center &&
        typeof center.lat === "number" &&
        typeof center.lng === "number" &&
        isUsableLatLng(center.lat, center.lng)
      ) {
        result.center = { lat: center.lat, lng: center.lng }
      }
    }
    return result
  } catch {
    return {}
  }
}

function persistedPayload(state: PerlicaState): string {
  const persisted: PersistedState = {
    token: state.token,
    accountId: state.accountId,
    adAccountId: state.adAccountId,
    center: state.center,
    radius: state.radius,
  }
  return JSON.stringify({ state: persisted, version: 0 })
}

/**
 * Creates the package-owned store for one plugin lifecycle. Storage is
 * injected from `ctx.storage.secure`, so the module itself holds no host
 * singletons and two plugin instances never share state.
 */
export async function createPerlicaStore({
  http,
  storage,
}: PerlicaStoreOptions): Promise<PerlicaStore> {
  const api = createStore<PerlicaState>()((set) => ({
    token: "",
    accountId: "",
    adAccountId: DEFAULT_AD_ACCOUNT_ID,
    center: DEFAULT_CENTER,
    locationConfirmed: false,
    radius: DEFAULT_RADIUS,
    hasHydrated: false,
    login: ({ token, accountId, adAccountId }) =>
      set({
        token: token.trim(),
        accountId: accountId.trim(),
        adAccountId: adAccountId?.trim() || DEFAULT_AD_ACCOUNT_ID,
        locationConfirmed: false,
      }),
    logout: () =>
      set({
        token: "",
        accountId: "",
        adAccountId: DEFAULT_AD_ACCOUNT_ID,
        locationConfirmed: false,
      }),
    setCenter: (center) => set({ center, locationConfirmed: true }),
    setRadius: (radius) => set({ radius: clampRadius(radius) }),
  }))

  const stored = readPersisted(await storage.getItem(PERLICA_STORAGE_KEY).catch(() => null))
  api.setState({ ...stored, hasHydrated: true })

  let pendingWrite = Promise.resolve()
  let lastPayload = persistedPayload(api.getState())
  const unsubscribe = api.subscribe((state) => {
    const payload = persistedPayload(state)
    if (payload === lastPayload) return
    lastPayload = payload
    pendingWrite = pendingWrite
      .then(() => storage.setItem(PERLICA_STORAGE_KEY, payload))
      .catch(() => {
        // Secure storage failures are not recoverable from the page; the
        // in-memory state stays authoritative for the current session.
      })
  })

  const store: PerlicaStore = {
    api,
    getClient() {
      const { token, accountId, adAccountId } = api.getState()
      if (!token || !accountId) return null
      return new PerlicaClient(http, { token, accountId, adAccountId })
    },
    createClient(config) {
      return new PerlicaClient(http, config)
    },
    async dispose() {
      unsubscribe()
      await pendingWrite
    },
  }
  return store
}

/** Subscribes one page to the lifecycle-scoped store. */
export function usePerlicaState<T>(store: PerlicaStore, selector: (state: PerlicaState) => T): T {
  return useStore(store.api, selector)
}
