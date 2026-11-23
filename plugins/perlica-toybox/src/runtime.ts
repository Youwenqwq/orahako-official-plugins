import type { PluginHttpService, PluginNativeService, PluginStorageService } from "@orahako/sdk"
import { PerlicaClient, type PerlicaConfig } from "./extras/client"
import { createPerlicaSnapshotCache, type PerlicaSnapshotCache } from "./extras/cache"
import { isUsableLatLng } from "./extras/geo"
import { createPerlicaStore, type PerlicaStoreInstance } from "./extras/store"
import type { PerlicaCoords } from "./extras/types"

const GEOLOCATION_CAPABILITY = "native.geolocation"

/** Shape returned by the `native.geolocation` capability. */
interface NativePosition {
  latitude?: number
  longitude?: number
  coords?: { latitude?: number; longitude?: number }
}

export interface PerlicaRuntimeOptions {
  http: PluginHttpService
  native: PluginNativeService
  storage: PluginStorageService
}

export interface PerlicaRuntime {
  readonly store: PerlicaStoreInstance
  readonly cache: PerlicaSnapshotCache
  createClient(config: PerlicaConfig): PerlicaClient
  locate(): Promise<PerlicaCoords>
  dispose(): void
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

async function locate(native: PluginNativeService): Promise<PerlicaCoords> {
  const capabilities = native.capabilities
  if (native.isNative && capabilities.has(GEOLOCATION_CAPABILITY)) {
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
export function createPerlicaRuntime({
  http,
  native,
  storage,
}: PerlicaRuntimeOptions): PerlicaRuntime {
  const store = createPerlicaStore(storage)
  const cache = createPerlicaSnapshotCache(storage.local)
  return {
    store,
    cache,
    createClient: (config) => new PerlicaClient(http, config),
    locate: () => locate(native),
    dispose: () => store.dispose(),
  }
}
