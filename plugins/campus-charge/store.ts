import { defineStore, type StoreActionContext, type StoreInstance } from "@orahako/sdk"
import { normalizeTokenInput } from "./client"
import type { ChargeReading, PortNote, PortUsability } from "./types"

export const CHARGE_AUTH_STORAGE_KEY = "campus-charge-auth"
export const CHARGE_DATA_STORAGE_KEY = "campus-charge-data"

export interface ChargeAuthState {
  readonly token: string
}

export type ChargeAuthStoreInstance = StoreInstance<
  ChargeAuthState,
  {
    setToken(ctx: StoreActionContext<ChargeAuthState>, token: string): void
    clearToken(ctx: StoreActionContext<ChargeAuthState>): void
  }
>

export const chargeAuthStore = defineStore({
  init: (): ChargeAuthState => ({
    token: "",
  }),
  persist: { key: CHARGE_AUTH_STORAGE_KEY, mode: "secure" },
  actions: {
    setToken({ set }, token: string) {
      set({ token: normalizeTokenInput(token) })
    },
    clearToken({ set }) {
      set({ token: "" })
    },
  },
})

export interface ChargeDataState {
  readonly favorites: readonly string[]
  readonly notes: Readonly<Record<string, PortNote>>
  readonly readings: Readonly<Record<string, ChargeReading>>
  readonly cooldownUntil: number
}

export type ChargeDataStoreInstance = StoreInstance<
  ChargeDataState,
  {
    toggleFavorite(ctx: StoreActionContext<ChargeDataState>, code: string): void
    saveReading(ctx: StoreActionContext<ChargeDataState>, reading: ChargeReading): void
    savePortNote(
      ctx: StoreActionContext<ChargeDataState>,
      payload: { code: string; port: string; usability: PortUsability; note: string }
    ): void
    setCooldownUntil(ctx: StoreActionContext<ChargeDataState>, until: number): void
    clearReadings(ctx: StoreActionContext<ChargeDataState>): void
  }
>

export const chargeDataStore = defineStore({
  init: (): ChargeDataState => ({
    favorites: [],
    notes: {},
    readings: {},
    cooldownUntil: 0,
  }),
  persist: { key: CHARGE_DATA_STORAGE_KEY, mode: "local" },
  actions: {
    toggleFavorite({ get, set }, code: string) {
      const current = get().favorites
      const next = current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
      set({ favorites: next })
    },
    saveReading({ get, set }, reading: ChargeReading) {
      set({
        readings: {
          ...get().readings,
          [reading.code]: reading,
        },
      })
    },
    savePortNote(
      { get, set },
      payload: { code: string; port: string; usability: PortUsability; note: string }
    ) {
      const key = `${payload.code}:${payload.port}`
      const trimmedNote = payload.note.trim().slice(0, 200)
      const nextNotes = { ...get().notes }
      if (payload.usability === "unknown" && !trimmedNote) {
        delete nextNotes[key]
      } else {
        nextNotes[key] = {
          code: payload.code,
          port: payload.port,
          usability: payload.usability,
          note: trimmedNote,
          updatedAt: Date.now(),
        }
      }
      set({ notes: nextNotes })
    },
    setCooldownUntil({ get, set }, until: number) {
      set({ cooldownUntil: Math.max(get().cooldownUntil, until) })
    },
    clearReadings({ set }) {
      set({ readings: {} })
    },
  },
})
