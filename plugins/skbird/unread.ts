import type { SkbirdConfig } from "./client"
import type { SkbirdUnread } from "./types"

export interface SkbirdUnreadSyncOptions {
  /** Reads the credentials that are current *now*, not when a request started. */
  readonly getConfig: () => SkbirdConfig
  /** Performs the count request for an explicit credential snapshot. */
  readonly request: (config: SkbirdConfig) => Promise<SkbirdUnread>
  readonly publish: (count: number) => void
}

/**
 * Single-flight unread refresher keyed by credentials.
 *
 * Concurrent refreshes for the same account share one request. A credential
 * change never reuses the old in-flight request: the new account starts its
 * request immediately, while the old response is still compared against the
 * current credentials and discarded when they no longer match. An empty token
 * publishes zero without issuing a request.
 */
export function createSkbirdUnreadSync({
  getConfig,
  request,
  publish,
}: SkbirdUnreadSyncOptions): () => Promise<void> {
  let inFlight: { config: SkbirdConfig; promise: Promise<void> } | undefined

  return () => {
    const config = getConfig()
    if (!config.token) {
      publish(0)
      return Promise.resolve()
    }
    if (
      inFlight &&
      inFlight.config.token === config.token &&
      inFlight.config.deviceId === config.deviceId &&
      inFlight.config.alias === config.alias
    ) {
      return inFlight.promise
    }

    const promise = request(config)
      .then((value) => {
        const current = getConfig()
        if (
          current.token === config.token &&
          current.deviceId === config.deviceId &&
          current.alias === config.alias
        ) {
          publish(value.count + value.imCount)
        }
      })
      .catch(() => {})
    const entry = { config, promise }
    inFlight = entry
    void promise.finally(() => {
      // An older account's completion must not release the newer request.
      if (inFlight === entry) inFlight = undefined
    })
    return promise
  }
}
