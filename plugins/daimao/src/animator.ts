export type DaimaoPose = "tea" | "dango" | "gamer" | "relax"

export type DaimaoReactionKind =
  | "pat"
  | "dizzy"
  | "starry"
  | "eureka"
  | "questionWhite"
  | "questionBlack"
  | "serious"
  | "awkward"
  | "tears"

export interface DaimaoAppearanceConfig {
  readonly pose: DaimaoPose
  readonly santaHat: boolean
  readonly showDesk: boolean
  readonly blueDesk: boolean
  readonly altTea: boolean
  readonly altDango: boolean
  readonly altDish: boolean
  readonly riceBowl: boolean
  readonly eyeTracking: boolean
  readonly keyboardReact: boolean
}

export interface ParameterSink {
  setParameter(id: string, value: number): void
}

interface KeyBinding {
  readonly param: string
  readonly x: number
  readonly y: number
  readonly lift: number
}

/** Exact keyboard paw coordinates extracted from the model's exp3 presets. */
const KEY_BINDINGS: Readonly<Record<string, KeyBinding>> = {
  KeyQ: { param: "Param9", x: 18.48, y: -21.3, lift: 1 },
  KeyW: { param: "Param10", x: 4.82, y: -23.04, lift: 1 },
  KeyE: { param: "Param11", x: -8.97, y: -25.58, lift: 0.815 },
  KeyR: { param: "Param12", x: -24.64, y: -25.98, lift: 1 },
  AltLeft: { param: "Param13", x: 11.12, y: 28.39, lift: 1 },
  AltRight: { param: "Param13", x: 11.12, y: 28.39, lift: 1 },
  KeyA: { param: "Param14", x: 10.45, y: 3.62, lift: 1 },
  KeyS: { param: "Param15", x: -1.07, y: 3.48, lift: 1 },
  KeyD: { param: "Param16", x: -14.87, y: 4.55, lift: 1 },
  KeyF: { param: "Param17", x: -30.0, y: 6.16, lift: 1 },
  ControlLeft: { param: "Param18", x: 27.32, y: 26.25, lift: 1 },
  ControlRight: { param: "Param18", x: 27.32, y: 26.25, lift: 1 },
  ShiftLeft: { param: "Param19", x: 27.19, y: 6.03, lift: 1 },
  ShiftRight: { param: "Param19", x: 27.19, y: 6.03, lift: 1 },
  Space: { param: "Param20", x: -15.27, y: 24.91, lift: 1 },
}

const KEY_PARAM_IDS = [
  "Param9",
  "Param10",
  "Param11",
  "Param12",
  "Param13",
  "Param14",
  "Param15",
  "Param16",
  "Param17",
  "Param18",
  "Param19",
  "Param20",
] as const

const REACTION_ROTATION: readonly DaimaoReactionKind[] = [
  "starry",
  "eureka",
  "questionWhite",
  "serious",
  "awkward",
  "questionBlack",
  "tears",
]

type IdleRoutine =
  | { kind: "none" }
  | { kind: "lookAround"; elapsed: number; duration: number; dirX: number; dirY: number }
  | { kind: "munch"; elapsed: number; duration: number }
  | { kind: "sleepy"; elapsed: number; duration: number }
  | { kind: "gamerTap"; elapsed: number; duration: number; keyCode: string }

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Procedural animation, gaze tracking, Bongo-Cat keyboard/mouse reactivity,
 * click reactions, and autonomous idle choreography for Daimao.
 */
export class DaimaoAnimator {
  private time = 0
  private lastInteractionAt = 0

  // Gaze target in [-1, 1]
  private gazeTargetX = 0
  private gazeTargetY = 0
  private gazeX = 0
  private gazeY = 0

  // Smooth expression values
  private readonly smooth = new Map<string, number>()

  // Blink state
  private nextBlinkIn = 2.6
  private blinkPhase = -1
  private doubleBlinkPending = false

  // Timed reaction overlay
  private activeReaction: { kind: DaimaoReactionKind; remaining: number; duration: number } | null =
    null
  private dizzySpinAngle = 0
  private recentTapTimestamps: number[] = []
  private reactionCursor = 0

  // Idle routine state
  private idleRoutine: IdleRoutine = { kind: "none" }
  private nextIdleIn = 8

  // Live keyboard & mouse input state
  private readonly pressedKeys = new Set<string>()
  private lastPressedKey: string | null = null
  private mouseLeftDown = false
  private mouseRightDown = false
  private mouseX = 0
  private mouseY = 0

  setGazeTarget(nx: number, ny: number): void {
    this.gazeTargetX = clamp(nx, -1, 1)
    this.gazeTargetY = clamp(ny, -1, 1)
    this.mouseX = clamp(nx * 30, -30, 30)
    this.mouseY = clamp(-ny * 30, -30, 30)
  }

  setPointerButtons(left: boolean, right: boolean): void {
    this.mouseLeftDown = left
    this.mouseRightDown = right
  }

  setKeyPressed(code: string, pressed: boolean): void {
    if (!(code in KEY_BINDINGS)) return
    if (pressed) {
      this.pressedKeys.add(code)
      this.lastPressedKey = code
      this.lastInteractionAt = this.time
    } else {
      this.pressedKeys.delete(code)
      if (this.lastPressedKey === code) {
        this.lastPressedKey = this.pressedKeys.size > 0 ? [...this.pressedKeys].at(-1)! : null
      }
    }
  }

  /**
   * Handle a tap/click on Daimao.
   * @param normalizedY 0 = top of canvas (head), 1 = bottom of canvas (desk/body)
   * @returns The triggered reaction kind for speech bubble / UI feedback.
   */
  triggerTap(normalizedY: number): DaimaoReactionKind {
    this.lastInteractionAt = this.time
    this.idleRoutine = { kind: "none" }
    this.nextIdleIn = 10 + Math.random() * 8

    // Detect rapid poke combo (5+ taps within 2.2s -> dizzy spin eyes!)
    const now = this.time
    this.recentTapTimestamps = this.recentTapTimestamps.filter((t) => now - t < 2.2)
    this.recentTapTimestamps.push(now)
    if (this.recentTapTimestamps.length >= 5) {
      this.recentTapTimestamps = []
      this.triggerReaction("dizzy", 3.6)
      return "dizzy"
    }

    // Upper 42% of canvas = head pat!
    if (normalizedY < 0.42) {
      this.triggerReaction("pat", 2.4)
      return "pat"
    }

    const kind = REACTION_ROTATION[this.reactionCursor % REACTION_ROTATION.length]
    this.reactionCursor += 1
    this.triggerReaction(kind, 2.8)
    return kind
  }

  triggerReaction(kind: DaimaoReactionKind, durationSeconds = 2.8): void {
    this.lastInteractionAt = this.time
    this.activeReaction = { kind, remaining: durationSeconds, duration: durationSeconds }
  }

  getActiveReaction(): DaimaoReactionKind | null {
    return this.activeReaction?.kind ?? null
  }

  update(dtSeconds: number, config: DaimaoAppearanceConfig, sink: ParameterSink): void {
    const dt = Math.min(Math.max(dtSeconds, 0.001), 0.05)
    this.time += dt

    if (this.activeReaction) {
      this.activeReaction.remaining -= dt
      if (this.activeReaction.remaining <= 0) {
        this.activeReaction = null
      }
    }

    this.stepIdleRoutine(dt, config)

    // Smooth gaze with idle overrides
    let targetGazeX = config.eyeTracking ? this.gazeTargetX : 0
    let targetGazeY = config.eyeTracking ? this.gazeTargetY : 0
    if (this.idleRoutine.kind === "lookAround") {
      targetGazeX = this.idleRoutine.dirX
      targetGazeY = this.idleRoutine.dirY
    } else if (this.activeReaction?.kind === "pat") {
      targetGazeX = Math.sin(this.time * 7) * 0.25
      targetGazeY = 0.25
    }

    this.gazeX = damp(this.gazeX, targetGazeX, 7, dt)
    this.gazeY = damp(this.gazeY, targetGazeY, 7, dt)

    // Breathing & gentle ambient sway
    const breath = 0.5 + 0.5 * Math.sin(this.time * 2.1)
    const swayX = Math.sin(this.time * 0.85) * 2.2
    const swayZ = Math.sin(this.time * 0.65 + 1.1) * 3.0

    let headX = this.gazeX * 22 + swayX
    let headY = this.gazeY * 16 + Math.sin(this.time * 1.05) * 1.4
    let headZ = -this.gazeX * 8 + swayZ

    if (this.activeReaction?.kind === "dizzy") {
      headZ += Math.sin(this.time * 10) * 10
      headX += Math.cos(this.time * 8) * 6
    } else if (this.activeReaction?.kind === "pat") {
      headY -= Math.abs(Math.sin(this.time * 6)) * 6
      headZ += Math.sin(this.time * 6) * 8
    }

    sink.setParameter("ParamBreath", breath)
    sink.setParameter("ParamAngleX", clamp(headX, -30, 30))
    sink.setParameter("ParamAngleY", clamp(headY, -30, 30))
    sink.setParameter("ParamAngleZ", clamp(headZ, -30, 30))
    sink.setParameter("ParamBodyAngleX", clamp(this.gazeX * 6 + swayX * 0.4, -10, 10))
    sink.setParameter("ParamBodyAngleY", clamp(this.gazeY * 4 + (breath - 0.5) * 2, -10, 10))
    sink.setParameter("ParamBodyAngleZ", clamp(-this.gazeX * 4 + swayZ * 0.5, -10, 10))
    sink.setParameter("ParamEyeBallX", clamp(this.gazeX * 0.9, -1, 1))
    sink.setParameter("ParamEyeBallY", clamp(this.gazeY * 0.8, -1, 1))

    // Blink & eyes
    const blinkOpen = this.stepBlink(dt)
    const isSleepy = this.idleRoutine.kind === "sleepy"
    const isPat = this.activeReaction?.kind === "pat"
    const eyeOpenTarget = isPat ? 0.15 : isSleepy ? 0.35 : blinkOpen
    const eyeOpen = this.smoothParam("eyeOpen", eyeOpenTarget, 18, dt)
    sink.setParameter("ParamEyeLOpen", eyeOpen)
    sink.setParameter("ParamEyeROpen", eyeOpen)

    const smileTarget = isPat || this.activeReaction?.kind === "starry" ? 1 : 0
    const smile = this.smoothParam("eyeSmile", smileTarget, 10, dt)
    sink.setParameter("ParamEyeLSmile", smile)
    sink.setParameter("ParamEyeRSmile", smile)

    // Cheek blush
    const blushTarget = isPat || this.activeReaction?.kind === "awkward" ? 1 : 0
    sink.setParameter("ParamCheek", this.smoothParam("cheek", blushTarget, 8, dt))

    // Mouth (munching dango, sipping tea, purring, or surprised)
    let mouthOpenTarget = 0
    let mouthFormTarget = 0.25
    if (this.idleRoutine.kind === "munch") {
      mouthOpenTarget = 0.3 + 0.35 * Math.abs(Math.sin(this.time * 7.5))
      mouthFormTarget = 0.6
    } else if (isPat) {
      mouthOpenTarget = 0.22 + 0.1 * Math.sin(this.time * 8)
      mouthFormTarget = 0.8
    } else if (this.activeReaction?.kind === "eureka" || this.activeReaction?.kind === "starry") {
      mouthOpenTarget = 0.55
      mouthFormTarget = 0.7
    } else if (this.activeReaction?.kind === "awkward" || this.activeReaction?.kind === "tears") {
      mouthOpenTarget = 0.25
      mouthFormTarget = -0.6
    } else if (this.activeReaction?.kind === "dizzy") {
      mouthOpenTarget = 0.45
      mouthFormTarget = -0.4
    }
    sink.setParameter("ParamMouthOpenY", this.smoothParam("mouthOpen", mouthOpenTarget, 14, dt))
    sink.setParameter("ParamMouthForm", this.smoothParam("mouthForm", mouthFormTarget, 10, dt))

    // Reactions / Expressions
    const rx = this.activeReaction?.kind ?? null
    const isDizzy = rx === "dizzy"
    if (isDizzy) {
      this.dizzySpinAngle = (this.dizzySpinAngle + dt * 540) % 360
    }
    sink.setParameter("Param21", this.smoothParam("dizzyOn", isDizzy ? 1 : 0, 12, dt))
    sink.setParameter("Param", isDizzy ? this.dizzySpinAngle : 0)
    sink.setParameter("Param34", this.smoothParam("awkward", rx === "awkward" ? 1 : 0, 12, dt))
    sink.setParameter("Param35", this.smoothParam("starry", rx === "starry" ? 1 : 0, 12, dt))
    sink.setParameter("Param36", this.smoothParam("tears", rx === "tears" ? 1 : 0, 12, dt))
    sink.setParameter(
      "Param37",
      this.smoothParam("questionW", rx === "questionWhite" ? 10 : 0, 12, dt)
    )
    sink.setParameter("Param47", this.smoothParam("questionB", rx === "questionBlack" ? 1 : 0, 12, dt))
    sink.setParameter("Param39", this.smoothParam("eureka", rx === "eureka" ? 1 : 0, 12, dt))
    sink.setParameter("Param41", this.smoothParam("serious", rx === "serious" ? 1 : 0, 12, dt))

    // Props & Pose Mode
    const isTea = config.pose === "tea"
    const isDango = config.pose === "dango"
    const isGamer = config.pose === "gamer"

    sink.setParameter("Param24", this.smoothParam("poseTea", isTea ? 1 : 0, 10, dt))
    sink.setParameter("Param25", this.smoothParam("poseDango", isDango ? 1 : 0, 10, dt))
    sink.setParameter("Param22", this.smoothParam("poseGamer", isGamer ? 1 : 0, 10, dt))
    sink.setParameter("Param23", this.smoothParam("desk", config.showDesk ? 0 : 1, 10, dt))
    sink.setParameter("Param33", this.smoothParam("blueDesk", config.blueDesk ? 1 : 0, 10, dt))

    // Rising tea steam loop (matches Scene2.motion3.json)
    sink.setParameter("Param26", isTea ? (this.time * 0.45) % 1 : 0)
    sink.setParameter("Param40", this.smoothParam("altTea", config.altTea ? 1 : 0, 10, dt))
    sink.setParameter("Param44", this.smoothParam("altDango1", config.altDango ? 1 : 0, 10, dt))
    sink.setParameter("Param45", this.smoothParam("altDango2", config.altDango ? 1 : 0, 10, dt))
    sink.setParameter("Param43", this.smoothParam("altDish", config.altDish ? 1 : 0, 10, dt))
    sink.setParameter("Param42", this.smoothParam("riceBowl", config.riceBowl ? 1 : 0, 10, dt))

    // Accessories (Santa hat)
    sink.setParameter("Param48", this.smoothParam("santaHat", config.santaHat ? 1 : 0, 10, dt))

    // Keyboard & Mouse Bongo-Cat paw tracking
    const activeKeyCode =
      isGamer && config.keyboardReact
        ? this.lastPressedKey ??
          (this.idleRoutine.kind === "gamerTap" ? this.idleRoutine.keyCode : null)
        : null
    const binding = activeKeyCode ? KEY_BINDINGS[activeKeyCode] : undefined

    sink.setParameter("Param2", this.smoothParam("mouseX", isGamer ? this.mouseX : 0, 16, dt))
    sink.setParameter("Param3", this.smoothParam("mouseY", isGamer ? this.mouseY : 0, 16, dt))
    sink.setParameter(
      "Param4",
      this.smoothParam("clickL", isGamer && this.mouseLeftDown ? 1 : 0, 24, dt)
    )
    sink.setParameter(
      "Param5",
      this.smoothParam("clickR", isGamer && this.mouseRightDown ? 1 : 0, 24, dt)
    )
    sink.setParameter("Param8", this.smoothParam("pawLift", binding ? binding.lift : 0, 22, dt))
    sink.setParameter("Param6", this.smoothParam("kbX", binding ? binding.x : 0, 22, dt))
    sink.setParameter("Param7", this.smoothParam("kbY", binding ? binding.y : 0, 22, dt))

    for (const paramId of KEY_PARAM_IDS) {
      const active = binding?.param === paramId ? 1 : 0
      sink.setParameter(paramId, this.smoothParam(paramId, active, 24, dt))
    }
  }

  private smoothParam(key: string, target: number, lambda: number, dt: number): number {
    const prev = this.smooth.get(key) ?? target
    const next = damp(prev, target, lambda, dt)
    this.smooth.set(key, next)
    return next
  }

  private stepBlink(dt: number): number {
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt
      const duration = 0.16
      if (this.blinkPhase >= duration) {
        this.blinkPhase = -1
        if (this.doubleBlinkPending) {
          this.doubleBlinkPending = false
          this.nextBlinkIn = 0.12
        } else {
          this.nextBlinkIn = 2.4 + Math.random() * 3.8
          this.doubleBlinkPending = Math.random() < 0.22
        }
        return 1
      }
      const p = this.blinkPhase / duration
      return Math.abs(Math.cos(p * Math.PI))
    }

    this.nextBlinkIn -= dt
    if (this.nextBlinkIn <= 0) {
      this.blinkPhase = 0
    }
    return 1
  }

  private stepIdleRoutine(dt: number, config: DaimaoAppearanceConfig): void {
    if (this.idleRoutine.kind !== "none") {
      this.idleRoutine.elapsed += dt
      if (this.idleRoutine.elapsed >= this.idleRoutine.duration) {
        this.idleRoutine = { kind: "none" }
        this.nextIdleIn = 7 + Math.random() * 10
      }
      return
    }

    if (this.activeReaction) return

    this.nextIdleIn -= dt
    if (this.nextIdleIn > 0) return

    const quietDuration = this.time - this.lastInteractionAt
    const roll = Math.random()

    if (quietDuration > 45 && roll < 0.28) {
      this.idleRoutine = { kind: "sleepy", elapsed: 0, duration: 5.5 }
    } else if (config.pose === "gamer" && roll < 0.5) {
      const keys = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyE", "KeyQ"]
      const keyCode = keys[Math.floor(Math.random() * keys.length)]
      this.idleRoutine = { kind: "gamerTap", elapsed: 0, duration: 0.45, keyCode }
    } else if ((config.pose === "dango" || config.pose === "tea") && roll < 0.5) {
      this.idleRoutine = { kind: "munch", elapsed: 0, duration: 2.2 }
    } else if (roll < 0.78) {
      this.idleRoutine = {
        kind: "lookAround",
        elapsed: 0,
        duration: 2.6,
        dirX: (Math.random() - 0.5) * 1.4,
        dirY: (Math.random() - 0.5) * 0.8,
      }
    } else {
      // Occasional cute autonomous expression
      const cute: readonly DaimaoReactionKind[] = ["starry", "eureka", "questionWhite"]
      this.triggerReaction(cute[Math.floor(Math.random() * cute.length)], 2.4)
      this.nextIdleIn = 10 + Math.random() * 10
    }
  }
}
