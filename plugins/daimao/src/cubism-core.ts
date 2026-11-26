import { Live2DCubismCore } from "./vendor/live2dcubismcore.js"

export interface CubismCanvasInfo {
  readonly CanvasWidth: number
  readonly CanvasHeight: number
  readonly CanvasOriginX: number
  readonly CanvasOriginY: number
  readonly PixelsPerUnit: number
}

export interface CubismParameters {
  readonly count: number
  readonly ids: readonly string[]
  readonly minimumValues: Float32Array
  readonly maximumValues: Float32Array
  readonly defaultValues: Float32Array
  readonly values: Float32Array
}

export interface CubismParts {
  readonly count: number
  readonly ids: readonly string[]
  readonly opacities: Float32Array
}

export interface CubismDrawables {
  readonly count: number
  readonly ids: readonly string[]
  readonly constantFlags: Uint8Array
  readonly dynamicFlags: Uint8Array
  readonly textureIndices: Int32Array
  readonly drawOrders: Int32Array
  readonly renderOrders: Int32Array
  readonly opacities: Float32Array
  readonly maskCounts: Int32Array
  readonly masks: readonly Int32Array[]
  readonly vertexCounts: Int32Array
  readonly vertexPositions: readonly Float32Array[]
  readonly vertexUvs: readonly Float32Array[]
  readonly indexCounts: Int32Array
  readonly indices: readonly Uint16Array[]
  readonly multiplyColors: Float32Array
  readonly screenColors: Float32Array
}

export interface CubismMoc {
  _release?(): void
  release?(): void
}

export interface CubismModel {
  readonly canvasinfo: CubismCanvasInfo
  readonly parameters: CubismParameters
  readonly parts: CubismParts
  readonly drawables: CubismDrawables
  update(): void
  release(): void
}

export interface CubismCoreAPI {
  readonly Version: {
    csmGetVersion(): number
    csmGetLatestMocVersion(): number
  }
  readonly Moc: {
    fromArrayBuffer(buffer: ArrayBuffer): CubismMoc | null
  }
  readonly Model: {
    fromMoc(moc: CubismMoc): CubismModel | null
  }
  readonly Utils: {
    hasBlendAdditiveBit(flags: number): boolean
    hasBlendMultiplicativeBit(flags: number): boolean
    hasIsDoubleSidedBit(flags: number): boolean
    hasIsInvertedMaskBit(flags: number): boolean
    hasIsVisibleBit(flags: number): boolean
  }
}

let readyPromise: Promise<CubismCoreAPI> | undefined

/**
 * Wait for the bundled Live2D Cubism Core WASM runtime to finish initializing.
 */
export function loadCubismCore(): Promise<CubismCoreAPI> {
  readyPromise ??= (async () => {
    const core = Live2DCubismCore as unknown as CubismCoreAPI
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        if (core.Version.csmGetVersion() > 0) return core
      } catch {
        // WASM runtime still instantiating
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10)
      })
    }
    throw new Error("Live2D Cubism Core failed to initialize within timeout")
  })()
  return readyPromise
}
