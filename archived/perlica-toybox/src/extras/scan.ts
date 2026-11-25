const USER_CODE_PATTERN = /^\d{8}$/
const MACHINE_NO_PATTERN = /^\d{9}$/
const CODE_QUERY_PATTERN = /(?:^|[?&\s])(?:code|userCode|machineNO)=([^&#\s]+)/gi

/** Extract an eight-digit body code or nine-digit internal number from text or a vehicle query. */
export function parsePerlicaCode(text: string): string | null {
  const value = text.trim()
  if (USER_CODE_PATTERN.test(value) || MACHINE_NO_PATTERN.test(value)) return value

  for (const match of value.matchAll(CODE_QUERY_PATTERN)) {
    let candidate: string
    try {
      candidate = decodeURIComponent(match[1])
    } catch {
      continue
    }

    if (USER_CODE_PATTERN.test(candidate) || MACHINE_NO_PATTERN.test(candidate)) return candidate
  }

  return null
}

/**
 * Nine-digit internal numbers are only usable when the nearby list can map one
 * back to its eight-digit body code. Everything else stays on the body-code flow.
 */
export function resolvePerlicaUserCode(
  code: string,
  machines: ReadonlyArray<{ userCode: string; machineNo?: string }>
): string | null {
  const value = code.trim()
  if (USER_CODE_PATTERN.test(value)) return value
  if (!MACHINE_NO_PATTERN.test(value)) return null
  const machine = machines.find((candidate) => candidate.machineNo === value)
  return machine?.userCode || null
}
