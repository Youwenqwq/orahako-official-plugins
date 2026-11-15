import { describe, expect, it } from "vitest"
import {
  estimateReturnFare,
  fareRulesFromMachineFee,
  normalFareCents,
  selectRideCard,
} from "./fare"
import type { PerlicaMachineFee, PerlicaRideCard } from "./types"

const RULES = { baseTime: 20, baseTimeFee: 150, overTime: 10, overTimeFee: 100 }

function card(overrides: Partial<PerlicaRideCard> = {}): PerlicaRideCard {
  return {
    name: "电动车月骑行卡",
    feeName: "全车型",
    startDate: "2030-01-01 00:00:00",
    dueTime: "2030-02-01 23:59:59",
    remainingCount: 40,
    maxRide: 100,
    useCount: 10,
    timeCount: 10,
    currentNum: 2,
    isValid: true,
    raw: {},
    ...overrides,
  }
}

function machineFee(raw: Record<string, unknown>): PerlicaMachineFee {
  return {
    machineNo: "12345678",
    fee: 1.5,
    price: 1.5,
    unit: "",
    description: "",
    raw,
  }
}

describe("normalFareCents", () => {
  it("bills the base block then each started overtime block", () => {
    expect(normalFareCents(0, RULES)).toBe(0)
    expect(normalFareCents(19.9, RULES)).toBe(150)
    expect(normalFareCents(20, RULES)).toBe(150)
    expect(normalFareCents(20.1, RULES)).toBe(250)
    expect(normalFareCents(30, RULES)).toBe(250)
    expect(normalFareCents(30.1, RULES)).toBe(350)
    expect(normalFareCents(30.8, RULES)).toBe(350)
  })
})

describe("fareRulesFromMachineFee", () => {
  it("reads the time billing fields", () => {
    expect(
      fareRulesFromMachineFee(
        machineFee({
          baseTime: 20,
          baseTimeFee: 150,
          overTime: 10,
          overTimeFee: 100,
          baseMileFee: 0,
          overMileFee: 0,
        })
      )
    ).toEqual(RULES)
  })

  it("refuses mileage or capped pricing because the time shift would be wrong", () => {
    expect(fareRulesFromMachineFee(machineFee({ ...RULES, baseMileFee: 1 }))).toBeNull()
    expect(fareRulesFromMachineFee(machineFee({ ...RULES, overMileFee: 1 }))).toBeNull()
    expect(fareRulesFromMachineFee(machineFee({ ...RULES, capTimeFee: 100 }))).toBeNull()
  })

  it("rejects missing or invalid blocks", () => {
    expect(fareRulesFromMachineFee(null)).toBeNull()
    expect(fareRulesFromMachineFee(machineFee({ baseTime: 0, baseTimeFee: 150 }))).toBeNull()
  })
})

describe("estimateReturnFare", () => {
  it("drops the card's free minutes and bills the remaining time", () => {
    expect(estimateReturnFare(150, 6, card(), RULES)).toMatchObject({
      grossCents: 150,
      deductionCents: 150,
      payableCents: 0,
    })
    expect(estimateReturnFare(150, 10, card(), RULES)).toMatchObject({
      deductionCents: 150,
      payableCents: 0,
    })
    expect(estimateReturnFare(150, 14.7, card(), RULES)).toMatchObject({
      grossCents: 150,
      deductionCents: 0,
      payableCents: 150,
    })
    expect(estimateReturnFare(350, 30.8, card(), RULES)).toMatchObject({
      grossCents: 350,
      deductionCents: 100,
      payableCents: 250,
    })
  })

  it("uses the free minutes supplied by the card", () => {
    expect(estimateReturnFare(350, 35, card({ timeCount: 15 }), RULES)).toMatchObject({
      freeMinutes: 15,
      deductionCents: 200,
      payableCents: 150,
    })
  })

  it("does not deduct when the card has no remaining rides", () => {
    expect(estimateReturnFare(150, 6, card({ remainingCount: 0 }), RULES)).toMatchObject({
      cardName: null,
      deductionCents: 0,
      payableCents: 150,
    })
  })

  it("reports the card without inventing a deduction when rules are missing", () => {
    expect(estimateReturnFare(150, 6, card(), null)).toMatchObject({
      cardName: "电动车月骑行卡",
      freeMinutes: 10,
      deductionCents: 0,
      payableCents: 150,
      estimated: false,
    })
  })

  it("never lets the estimate exceed the current fee", () => {
    expect(estimateReturnFare(100, 30.8, card(), RULES)).toMatchObject({
      grossCents: 100,
      deductionCents: 0,
      payableCents: 100,
    })
  })
})

describe("selectRideCard", () => {
  it("requires a valid card with remaining rides and free minutes", () => {
    expect(selectRideCard([card({ isValid: false })])).toBeNull()
    expect(selectRideCard([card({ remainingCount: 0 })])).toBeNull()
    expect(selectRideCard([card({ timeCount: 0 })])).toBeNull()
    expect(selectRideCard([card()])?.name).toBe("电动车月骑行卡")
  })
})
