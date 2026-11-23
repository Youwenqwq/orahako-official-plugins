import {
  defineStore,
  type PluginStorageService,
  type StoreInstance,
} from "@orahako/sdk"
import type { PerlicaConfig } from "./client"
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
}

function clampRadius(value: number): number {
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, Math.round(value)))
}

/**
 * Package-owned credential and map-preference store. `apply` calls `.create`
 * with the scoped storage service and disposes the instance with its plugin
 * lifecycle, so no module-level host singleton or global state is involved.
 */
export const perlicaStore = defineStore({
  init: (): PerlicaState => ({
    token: "",
    accountId: "",
    adAccountId: DEFAULT_AD_ACCOUNT_ID,
    center: DEFAULT_CENTER,
    locationConfirmed: false,
    radius: DEFAULT_RADIUS,
  }),
  persist: { key: PERLICA_STORAGE_KEY, mode: "secure" },
  actions: {
    login(ctx, config: PerlicaConfig) {
      ctx.set((state) => ({
        ...state,
        token: config.token.trim(),
        accountId: config.accountId.trim(),
        adAccountId: config.adAccountId?.trim() || DEFAULT_AD_ACCOUNT_ID,
        locationConfirmed: false,
      }))
    },
    logout(ctx) {
      ctx.set((state) => ({
        ...state,
        token: "",
        accountId: "",
        adAccountId: DEFAULT_AD_ACCOUNT_ID,
        locationConfirmed: false,
      }))
    },
    setCenter(ctx, center: PerlicaCoords) {
      ctx.set((state) => ({ ...state, center, locationConfirmed: true }))
    },
    setRadius(ctx, radius: number) {
      ctx.set((state) => ({ ...state, radius: clampRadius(radius) }))
    },
  },
})

export type PerlicaStoreInstance = StoreInstance<
  PerlicaState,
  typeof perlicaStore.spec.actions
>

export function createPerlicaStore(storage: PluginStorageService): PerlicaStoreInstance {
  return perlicaStore.create(storage)
}
