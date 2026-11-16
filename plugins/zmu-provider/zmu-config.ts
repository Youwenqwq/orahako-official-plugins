import rawConfig from "./zmu.json"

/**
 * ZMU-owned protocol configuration.
 *
 * The host provider runtime knows nothing about these fields; they are defined
 * and consumed entirely inside the ZMU provider plugin.
 */
export interface ZMUConfig {
  readonly id: string
  readonly name: string
  readonly jwxt: {
    readonly jwxtBaseUrl: string
  }
}

/** ZMU-owned school configuration contributed by this provider plugin. */
export const ZMU_CONFIG = rawConfig as ZMUConfig
