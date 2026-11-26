import { defineStore } from "@orahako/sdk"
import type { DaimaoPose } from "./animator"

export const MIN_DAIMAO_SCALE = 0.4
export const MAX_DAIMAO_SCALE = 2.2
export const DEFAULT_DAIMAO_SCALE = 1.0

export const DAIMAO_POSES: readonly DaimaoPose[] = ["tea", "dango", "gamer", "relax"]

export function isDaimaoPose(value: string): value is DaimaoPose {
  return (DAIMAO_POSES as readonly string[]).includes(value)
}

export function clampDaimaoScale(scale: number): number {
  if (!Number.isFinite(scale)) return DEFAULT_DAIMAO_SCALE
  return Math.round(Math.max(MIN_DAIMAO_SCALE, Math.min(MAX_DAIMAO_SCALE, scale)) * 100) / 100
}

export function clampUnitRatio(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.round(Math.max(0, Math.min(1, value)) * 10000) / 10000
}

export interface DaimaoState {
  readonly enabled: boolean
  readonly scale: number
  /** Normalized horizontal position in [0, 1] across available viewport width (null = right edge). */
  readonly xRatio: number | null
  /** Normalized vertical position in [0, 1] across available viewport height (null = bottom edge). */
  readonly yRatio: number | null
  readonly pose: DaimaoPose
  readonly santaHat: boolean
  readonly showDesk: boolean
  readonly blueDesk: boolean
  readonly altTea: boolean
  readonly altDango: boolean
  readonly altDish: boolean
  readonly riceBowl: boolean
  readonly eyeTracking: boolean
  readonly speechBubbles: boolean
  readonly keyboardReact: boolean
  readonly showToolbar: boolean
  readonly clickThrough: boolean
}

export const DEFAULT_DAIMAO_STATE: DaimaoState = {
  enabled: true,
  scale: DEFAULT_DAIMAO_SCALE,
  xRatio: null,
  yRatio: null,
  pose: "tea",
  santaHat: false,
  showDesk: true,
  blueDesk: false,
  altTea: false,
  altDango: false,
  altDish: false,
  riceBowl: false,
  eyeTracking: true,
  speechBubbles: true,
  keyboardReact: true,
  showToolbar: true,
  clickThrough: false,
}

function sanitizePersistedState(raw: unknown): DaimaoState {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_DAIMAO_STATE }
  }
  const data = raw as Partial<Record<keyof DaimaoState, unknown>>
  return {
    enabled: typeof data.enabled === "boolean" ? data.enabled : DEFAULT_DAIMAO_STATE.enabled,
    scale:
      typeof data.scale === "number"
        ? clampDaimaoScale(data.scale)
        : DEFAULT_DAIMAO_STATE.scale,
    xRatio:
      typeof data.xRatio === "number" && Number.isFinite(data.xRatio)
        ? clampUnitRatio(data.xRatio)
        : null,
    yRatio:
      typeof data.yRatio === "number" && Number.isFinite(data.yRatio)
        ? clampUnitRatio(data.yRatio)
        : null,
    pose:
      typeof data.pose === "string" && isDaimaoPose(data.pose)
        ? data.pose
        : DEFAULT_DAIMAO_STATE.pose,
    santaHat: typeof data.santaHat === "boolean" ? data.santaHat : DEFAULT_DAIMAO_STATE.santaHat,
    showDesk: typeof data.showDesk === "boolean" ? data.showDesk : DEFAULT_DAIMAO_STATE.showDesk,
    blueDesk: typeof data.blueDesk === "boolean" ? data.blueDesk : DEFAULT_DAIMAO_STATE.blueDesk,
    altTea: typeof data.altTea === "boolean" ? data.altTea : DEFAULT_DAIMAO_STATE.altTea,
    altDango: typeof data.altDango === "boolean" ? data.altDango : DEFAULT_DAIMAO_STATE.altDango,
    altDish: typeof data.altDish === "boolean" ? data.altDish : DEFAULT_DAIMAO_STATE.altDish,
    riceBowl: typeof data.riceBowl === "boolean" ? data.riceBowl : DEFAULT_DAIMAO_STATE.riceBowl,
    eyeTracking:
      typeof data.eyeTracking === "boolean" ? data.eyeTracking : DEFAULT_DAIMAO_STATE.eyeTracking,
    speechBubbles:
      typeof data.speechBubbles === "boolean"
        ? data.speechBubbles
        : DEFAULT_DAIMAO_STATE.speechBubbles,
    keyboardReact:
      typeof data.keyboardReact === "boolean"
        ? data.keyboardReact
        : DEFAULT_DAIMAO_STATE.keyboardReact,
    showToolbar:
      typeof data.showToolbar === "boolean" ? data.showToolbar : DEFAULT_DAIMAO_STATE.showToolbar,
    clickThrough:
      typeof data.clickThrough === "boolean"
        ? data.clickThrough
        : DEFAULT_DAIMAO_STATE.clickThrough,
  }
}

export const daimaoStore = defineStore({
  init: (): DaimaoState => ({ ...DEFAULT_DAIMAO_STATE }),
  persist: {
    key: "preferences",
    mode: "local",
    version: 3,
    migrate: (persisted) => sanitizePersistedState(persisted),
  },
  actions: {
    setEnabled: ({ set }, enabled: boolean) =>
      set((prev) => (prev.enabled === enabled ? prev : { ...prev, enabled })),
    setScale: ({ set }, scale: number) => {
      const next = clampDaimaoScale(scale)
      set((prev) => (prev.scale === next ? prev : { ...prev, scale: next }))
    },
    setPositionRatio: ({ set }, xRatio: number | null, yRatio: number | null) => {
      const nextX = xRatio === null ? null : clampUnitRatio(xRatio)
      const nextY = yRatio === null ? null : clampUnitRatio(yRatio)
      set((prev) =>
        prev.xRatio === nextX && prev.yRatio === nextY ? prev : { ...prev, xRatio: nextX, yRatio: nextY }
      )
    },
    setPose: ({ set }, pose: DaimaoPose) =>
      set((prev) => (prev.pose === pose ? prev : { ...prev, pose })),
    cyclePose: ({ get, set }) => {
      const current = get().pose
      const idx = DAIMAO_POSES.indexOf(current)
      const next = DAIMAO_POSES[(idx + 1) % DAIMAO_POSES.length]
      set((prev) => ({ ...prev, pose: next }))
      return next
    },
    setSantaHat: ({ set }, santaHat: boolean) =>
      set((prev) => (prev.santaHat === santaHat ? prev : { ...prev, santaHat })),
    toggleSantaHat: ({ set }) => set((prev) => ({ ...prev, santaHat: !prev.santaHat })),
    setShowDesk: ({ set }, showDesk: boolean) =>
      set((prev) => (prev.showDesk === showDesk ? prev : { ...prev, showDesk })),
    setBlueDesk: ({ set }, blueDesk: boolean) =>
      set((prev) => (prev.blueDesk === blueDesk ? prev : { ...prev, blueDesk })),
    setAltTea: ({ set }, altTea: boolean) =>
      set((prev) => (prev.altTea === altTea ? prev : { ...prev, altTea })),
    setAltDango: ({ set }, altDango: boolean) =>
      set((prev) => (prev.altDango === altDango ? prev : { ...prev, altDango })),
    setAltDish: ({ set }, altDish: boolean) =>
      set((prev) => (prev.altDish === altDish ? prev : { ...prev, altDish })),
    setRiceBowl: ({ set }, riceBowl: boolean) =>
      set((prev) => (prev.riceBowl === riceBowl ? prev : { ...prev, riceBowl })),
    setEyeTracking: ({ set }, eyeTracking: boolean) =>
      set((prev) => (prev.eyeTracking === eyeTracking ? prev : { ...prev, eyeTracking })),
    setSpeechBubbles: ({ set }, speechBubbles: boolean) =>
      set((prev) => (prev.speechBubbles === speechBubbles ? prev : { ...prev, speechBubbles })),
    setKeyboardReact: ({ set }, keyboardReact: boolean) =>
      set((prev) => (prev.keyboardReact === keyboardReact ? prev : { ...prev, keyboardReact })),
    setShowToolbar: ({ set }, showToolbar: boolean) =>
      set((prev) => (prev.showToolbar === showToolbar ? prev : { ...prev, showToolbar })),
    setClickThrough: ({ set }, clickThrough: boolean) =>
      set((prev) => (prev.clickThrough === clickThrough ? prev : { ...prev, clickThrough })),
    resetLayout: ({ set }) =>
      set((prev) => ({ ...prev, scale: DEFAULT_DAIMAO_SCALE, xRatio: null, yRatio: null })),
  },
})

export type DaimaoStoreDefinition = typeof daimaoStore
export type DaimaoStoreInstance = ReturnType<typeof daimaoStore.create>
