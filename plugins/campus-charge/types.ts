export interface ChargeDevice {
  readonly code: string
  readonly name: string
}

export interface ChargePort {
  readonly number: string
  readonly status: string
}

export interface ChargeReading {
  readonly code: string
  readonly checkedAt: number
  readonly online: boolean
  readonly ports: readonly ChargePort[]
}

export type PortUsability = "unknown" | "good" | "bad"

export interface PortNote {
  readonly code: string
  readonly port: string
  readonly usability: PortUsability
  readonly note: string
  readonly updatedAt: number
}

export type ChargeErrorCode =
  | "not_configured"
  | "login_expired"
  | "upstream_limited"
  | "query_failed"
  | "unknown_device"

export class ChargeClientError extends Error {
  constructor(
    readonly code: ChargeErrorCode,
    message: string,
    readonly retryAfterMs?: number
  ) {
    super(message)
    this.name = "ChargeClientError"
  }
}

export function isPortFree(status: string): boolean {
  return status === "idle" || status === "connected"
}

export function isReadingFresh(
  reading: ChargeReading | undefined,
  now = Date.now(),
  ttlMs = 60_000
): boolean {
  return Boolean(reading && now - reading.checkedAt < ttlMs)
}

export function countUsableFreePorts(
  reading: ChargeReading | undefined,
  notes: Readonly<Record<string, PortNote>>
): number {
  if (!reading || !reading.online) return 0
  return reading.ports.filter((port) => {
    if (!isPortFree(port.status)) return false
    const note = notes[`${reading.code}:${port.number}`]
    return note?.usability !== "bad"
  }).length
}
