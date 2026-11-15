import type { PerlicaMachineFee, PerlicaRideCard } from "./types"

export interface FareRules {
  baseTime: number
  baseTimeFee: number
  overTime: number
  overTimeFee: number
}

export interface ReturnFareEstimate {
  /** Current order fee in cents, before any ride-card deduction. */
  grossCents: number
  cardName: string | null
  freeMinutes: number
  deductionCents: number
  payableCents: number
  /** False when a card exists but the pricing rules needed to estimate it are unavailable. */
  estimated: boolean
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function fareRulesFromMachineFee(fee: PerlicaMachineFee | null): FareRules | null {
  if (!fee) return null
  const baseTime = finiteNumber(fee.raw.baseTime)
  const baseTimeFee = finiteNumber(fee.raw.baseTimeFee)
  const overTime = finiteNumber(fee.raw.overTime)
  const overTimeFee = finiteNumber(fee.raw.overTimeFee)
  if (baseTime === null || baseTimeFee === null || overTime === null || overTimeFee === null) {
    return null
  }
  if (baseTime <= 0 || overTime <= 0 || baseTimeFee < 0 || overTimeFee < 0) return null

  // The shift-the-clock estimate only holds for pure time billing. Never present
  // a card deduction when mileage or capped pricing could make it wrong.
  for (const key of ["baseMileFee", "overMileFee", "capTimeFee", "capMileFee"]) {
    const value = finiteNumber(fee.raw[key])
    if (value !== null && value > 0) return null
  }

  return { baseTime, baseTimeFee, overTime, overTimeFee }
}

export function normalFareCents(minutes: number, rules: FareRules): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0
  if (minutes <= rules.baseTime) return rules.baseTimeFee
  // Every started overtime block is billed in full. Temporary parking does not
  // pause the clock, so callers pass wall-clock minutes from the order start.
  const overtimeBlocks = Math.ceil((minutes - rules.baseTime) / rules.overTime)
  return rules.baseTimeFee + overtimeBlocks * rules.overTimeFee
}

export function selectRideCard(cards: PerlicaRideCard[]): PerlicaRideCard | null {
  return (
    cards.find((card) => card.isValid && card.remainingCount > 0 && card.timeCount > 0) ?? null
  )
}

export function estimateReturnFare(
  grossCents: number,
  durationMinutes: number,
  card: PerlicaRideCard | null,
  rules: FareRules | null
): ReturnFareEstimate {
  const gross = Number.isFinite(grossCents) ? Math.max(0, Math.round(grossCents)) : 0
  const eligible = card && card.remainingCount > 0 && card.timeCount > 0 ? card : null

  if (!eligible) {
    return {
      grossCents: gross,
      cardName: null,
      freeMinutes: 0,
      deductionCents: 0,
      payableCents: gross,
      estimated: true,
    }
  }

  if (!rules) {
    return {
      grossCents: gross,
      cardName: eligible.name || null,
      freeMinutes: eligible.timeCount,
      deductionCents: 0,
      payableCents: gross,
      estimated: false,
    }
  }

  // Card rule: the first timeCount minutes are free, then the normal order
  // pricing applies from zero. Example: 30.8 min with 10 free minutes is billed
  // as a 20.8 min order. Temporary parking is included in the wall-clock time.
  const payable = Math.min(
    gross,
    normalFareCents(Math.max(0, durationMinutes - eligible.timeCount), rules)
  )

  return {
    grossCents: gross,
    cardName: eligible.name || null,
    freeMinutes: eligible.timeCount,
    deductionCents: gross - payable,
    payableCents: payable,
    estimated: true,
  }
}
