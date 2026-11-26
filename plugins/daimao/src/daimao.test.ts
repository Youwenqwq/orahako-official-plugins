import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { validatePluginManifest } from "@orahako/sdk"
import { DaimaoAnimator, type DaimaoAppearanceConfig } from "./animator"
import { CubismPhysicsSolver, type Physics3Json, type PhysicsParameterBridge } from "./physics"
import {
  clampDaimaoScale,
  daimaoStore,
  DEFAULT_DAIMAO_STATE,
  MAX_DAIMAO_SCALE,
  MIN_DAIMAO_SCALE,
} from "./store"

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const BASE_CONFIG: DaimaoAppearanceConfig = {
  pose: "tea",
  santaHat: false,
  showDesk: true,
  blueDesk: false,
  altTea: false,
  altDango: false,
  altDish: false,
  riceBowl: false,
  eyeTracking: true,
  keyboardReact: true,
}

describe("orahako.daimao", () => {
  it("has a valid API v1 manifest", () => {
    const raw = JSON.parse(readFileSync(path.join(PLUGIN_ROOT, "manifest.json"), "utf8"))
    const manifest = validatePluginManifest(raw)
    expect(manifest.id).toBe("orahako.daimao")
    expect(manifest.apiVersion).toBe(1)
    expect(manifest.providerIndependent).toBe(true)
    expect(manifest.inject).toContain("assets")
    expect(manifest.inject).toContain("slots")
  })

  it("preserves full state across store actions and heals broken v1 persisted payloads", () => {
    const instance = daimaoStore.create()
    instance.actions.setScale(1.4)
    instance.actions.setPositionRatio(0.85, 1)
    instance.actions.cyclePose()
    instance.actions.setSantaHat(true)
    instance.actions.setShowToolbar(false)

    const snapshot = instance.source.getSnapshot()
    expect(snapshot.enabled).toBe(true)
    expect(snapshot.scale).toBe(1.4)
    expect(snapshot.xRatio).toBe(0.85)
    expect(snapshot.yRatio).toBe(1)
    expect(snapshot.pose).toBe("dango")
    expect(snapshot.santaHat).toBe(true)
    expect(snapshot.showDesk).toBe(true)
    expect(snapshot.showToolbar).toBe(false)

    const migrated = daimaoStore.spec.persist?.migrate?.({ enabled: true, x: 300, y: 400 }, 2)
    expect(migrated).toEqual(DEFAULT_DAIMAO_STATE)
    instance.dispose()
  })

  it("clamps model scale cleanly", () => {
    expect(clampDaimaoScale(0.1)).toBe(MIN_DAIMAO_SCALE)
    expect(clampDaimaoScale(9.9)).toBe(MAX_DAIMAO_SCALE)
    expect(clampDaimaoScale(Number.NaN)).toBe(DEFAULT_DAIMAO_STATE.scale)
    expect(clampDaimaoScale(1.234)).toBe(1.23)
  })

  it("triggers head pat on upper tap and dizzy spin on rapid poke combo", () => {
    const animator = new DaimaoAnimator()
    const params = new Map<string, number>()
    const sink = { setParameter: (id: string, value: number) => params.set(id, value) }

    expect(animator.triggerTap(0.2)).toBe("pat")
    for (let i = 0; i < 15; i += 1) animator.update(0.03, BASE_CONFIG, sink)
    expect(params.get("ParamCheek") ?? 0).toBeGreaterThan(0.5)
    expect(params.get("ParamEyeLSmile") ?? 0).toBeGreaterThan(0.5)

    // 4 more rapid taps within 2.2s -> 5th triggers dizzy!
    animator.triggerTap(0.6)
    animator.triggerTap(0.6)
    animator.triggerTap(0.6)
    expect(animator.triggerTap(0.6)).toBe("dizzy")

    for (let i = 0; i < 15; i += 1) animator.update(0.03, BASE_CONFIG, sink)
    expect(params.get("Param21") ?? 0).toBeGreaterThan(0.5)
    expect(params.get("Param") ?? 0).toBeGreaterThan(0)
  })

  it("drives Bongo-Cat keyboard & mouse parameters in gamer mode", () => {
    const animator = new DaimaoAnimator()
    const params = new Map<string, number>()
    const sink = { setParameter: (id: string, value: number) => params.set(id, value) }
    const gamerConfig: DaimaoAppearanceConfig = { ...BASE_CONFIG, pose: "gamer" }

    animator.setKeyPressed("KeyW", true)
    animator.setPointerButtons(true, false)
    for (let i = 0; i < 20; i += 1) animator.update(0.03, gamerConfig, sink)

    expect(params.get("Param22") ?? 0).toBeGreaterThan(0.8)
    expect(params.get("Param10") ?? 0).toBeGreaterThan(0.8)
    expect(params.get("Param8") ?? 0).toBeGreaterThan(0.8)
    expect(params.get("Param4") ?? 0).toBeGreaterThan(0.8)
  })

  it("solves ear physics from the bundled physics3.json", () => {
    const physicsJson = JSON.parse(
      readFileSync(path.join(PLUGIN_ROOT, "assets/physics3.json"), "utf8")
    ) as Physics3Json
    const solver = new CubismPhysicsSolver(physicsJson)
    const values = new Map<string, number>([
      ["ParamAngleX", 25],
      ["ParamAngleY", 10],
      ["ParamAngleZ", 18],
      ["Param27", 0],
      ["Param28", 0],
      ["Param29", 0],
      ["Param30", 0],
      ["Param31", 0],
      ["Param32", 0],
    ])
    const bridge: PhysicsParameterBridge = {
      getValue: (id) => values.get(id) ?? 0,
      getRange: (id) =>
        id.startsWith("ParamAngle") ? { min: -30, max: 30, def: 0 } : { min: -1, max: 1, def: 0 },
      setValue: (id, value) => values.set(id, value),
    }

    for (let i = 0; i < 20; i += 1) {
      solver.evaluate(bridge, 1 / 60)
    }
    expect(Math.abs(values.get("Param29") ?? 0)).toBeGreaterThan(0.01)
    expect(Math.abs(values.get("Param27") ?? 0)).toBeGreaterThan(0.01)
  })
})
