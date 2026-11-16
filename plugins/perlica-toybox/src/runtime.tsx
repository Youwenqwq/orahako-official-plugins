"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { PluginContext } from "@orahako/plugin-sdk"
import { PerlicaClient, type PerlicaConfig } from "./extras/client"
import { createPerlicaSnapshotCache, type PerlicaSnapshotCache } from "./extras/cache"
import { isUsableLatLng } from "./extras/geo"
import { createPerlicaStore, usePerlicaState, type PerlicaState, type PerlicaStore } from "./extras/store"
import type { PerlicaCoords } from "./extras/types"

const GEOLOCATION_CAPABILITY = "native.geolocation"

/** Shape returned by the `native.geolocation` capability. */
interface NativePosition {
  latitude?: number
  longitude?: number
  coords?: { latitude?: number; longitude?: number }
}

export interface PerlicaRuntime {
  readonly store: PerlicaStore
  readonly cache: PerlicaSnapshotCache
  getClient(): PerlicaClient | null
  createClient(config: PerlicaConfig): PerlicaClient
  locate(): Promise<PerlicaCoords>
  dispose(): Promise<void>
}

function readNativeCoords(value: NativePosition): PerlicaCoords | null {
  const latitude = value.coords?.latitude ?? value.latitude
  const longitude = value.coords?.longitude ?? value.longitude
  if (typeof latitude !== "number" || typeof longitude !== "number") return null
  return isUsableLatLng(latitude, longitude) ? { lat: latitude, lng: longitude } : null
}

function browserPosition(): Promise<PerlicaCoords> {
  const { promise, resolve, reject } = Promise.withResolvers<PerlicaCoords>()
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    reject(new Error("Geolocation is unavailable"))
    return promise
  }
  navigator.geolocation.getCurrentPosition(
    (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
    (error) => reject(new Error(error.message || "Geolocation failed")),
    { enableHighAccuracy: true }
  )
  return promise
}

async function locate(ctx: PluginContext): Promise<PerlicaCoords> {
  const capabilities = ctx.native.capabilities
  if (ctx.native.isNative && capabilities.has(GEOLOCATION_CAPABILITY)) {
    const position = await capabilities.invoke<NativePosition>(
      GEOLOCATION_CAPABILITY,
      "getCurrentPosition",
      { enableHighAccuracy: true }
    )
    const coords = readNativeCoords(position)
    if (!coords) throw new Error("Geolocation capability returned no usable position")
    return coords
  }
  // Web/PWA, and Android builds without the bridge capability, use the
  // WebView's own geolocation provider (Capacitor maps the permission prompt).
  return browserPosition()
}

/**
 * Creates the plugin-scoped data layer once per Cordis activation. Every host
 * dependency comes from the injected context, so there is no module-level
 * singleton and no private host import.
 */
export async function createPerlicaRuntime(ctx: PluginContext): Promise<PerlicaRuntime> {
  const store = await createPerlicaStore({ http: ctx.http, storage: ctx.storage.secure })
  return {
    store,
    cache: createPerlicaSnapshotCache(ctx.storage.local),
    getClient: () => store.getClient(),
    createClient: (config) => store.createClient(config),
    locate: () => locate(ctx),
    dispose: () => store.dispose(),
  }
}

const PerlicaRuntimeContext = createContext<PerlicaRuntime | null>(null)

export function PerlicaRuntimeProvider({
  runtime,
  children,
}: {
  runtime: PerlicaRuntime
  children: ReactNode
}) {
  return <PerlicaRuntimeContext.Provider value={runtime}>{children}</PerlicaRuntimeContext.Provider>
}

/** Resolves the runtime that the plugin injected around its registered pages. */
export function usePerlicaRuntime(): PerlicaRuntime {
  const runtime = useContext(PerlicaRuntimeContext)
  if (!runtime) throw new Error("PerlicaRuntimeProvider is missing above a Perlica page")
  return runtime
}

export function usePerlicaStore<T>(selector: (state: PerlicaState) => T): T {
  return usePerlicaState(usePerlicaRuntime().store, selector)
}
