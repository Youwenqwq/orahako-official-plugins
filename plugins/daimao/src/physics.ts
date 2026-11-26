export interface Physics3Json {
  readonly Version?: number
  readonly Meta?: {
    readonly Fps?: number
    readonly EffectiveForces?: {
      readonly Gravity?: { readonly X: number; readonly Y: number }
      readonly Wind?: { readonly X: number; readonly Y: number }
    }
  }
  readonly PhysicsSettings?: readonly PhysicsSettingJson[]
}

interface PhysicsInputJson {
  readonly Source: { readonly Target: string; readonly Id: string }
  readonly Weight: number
  readonly Type: "X" | "Y" | "Angle"
  readonly Reflect: boolean
}

interface PhysicsOutputJson {
  readonly Destination: { readonly Target: string; readonly Id: string }
  readonly VertexIndex: number
  readonly Scale: number
  readonly Weight: number
  readonly Type: "X" | "Y" | "Angle"
  readonly Reflect: boolean
}

interface PhysicsVertexJson {
  readonly Position: { readonly X: number; readonly Y: number }
  readonly Mobility: number
  readonly Delay: number
  readonly Acceleration: number
  readonly Radius: number
}

interface PhysicsSettingJson {
  readonly Id: string
  readonly Input: readonly PhysicsInputJson[]
  readonly Output: readonly PhysicsOutputJson[]
  readonly Vertices: readonly PhysicsVertexJson[]
  readonly Normalization?: {
    readonly Position?: { readonly Minimum: number; readonly Default: number; readonly Maximum: number }
    readonly Angle?: { readonly Minimum: number; readonly Default: number; readonly Maximum: number }
  }
}

interface ParticleState {
  positionX: number
  positionY: number
  lastPositionX: number
  lastPositionY: number
  velocityX: number
  velocityY: number
  forceX: number
  forceY: number
  lastGravityX: number
  lastGravityY: number
  readonly mobility: number
  readonly delay: number
  readonly acceleration: number
  readonly radius: number
}

interface RigRuntime {
  readonly inputs: readonly PhysicsInputJson[]
  readonly outputs: readonly PhysicsOutputJson[]
  readonly particles: ParticleState[]
  readonly posNorm: { min: number; def: number; max: number }
  readonly angleNorm: { min: number; def: number; max: number }
}

export interface PhysicsParameterBridge {
  getValue(id: string): number
  getRange(id: string): { min: number; max: number; def: number } | undefined
  setValue(id: string, value: number): void
}

function normalizeParameterValue(
  value: number,
  min: number,
  max: number,
  def: number,
  normMin: number,
  normMax: number,
  normDef: number,
  reflect: boolean
): number {
  const clamped = Math.max(min, Math.min(max, value))
  const minVal = Math.min(min, max)
  const maxVal = Math.max(min, max)
  const offset = clamped - def
  let result = normDef
  if (offset > 0) {
    const span = maxVal - def
    if (span > 1e-6) {
      result = normDef + (offset / span) * (normMax - normDef)
    }
  } else if (offset < 0) {
    const span = def - minVal
    if (span > 1e-6) {
      result = normDef + (offset / span) * (normDef - normMin)
    }
  }
  return reflect ? -result : result
}

/**
 * Lightweight Cubism Physics3 pendulum solver so ears and accessories bounce
 * naturally in response to head movement, petting, and idle motion.
 */
export class CubismPhysicsSolver {
  private readonly rigs: RigRuntime[]
  private readonly gravityX: number
  private readonly gravityY: number
  private readonly windX: number
  private readonly windY: number

  constructor(data: Physics3Json) {
    this.gravityX = data.Meta?.EffectiveForces?.Gravity?.X ?? 0
    this.gravityY = data.Meta?.EffectiveForces?.Gravity?.Y ?? -1
    this.windX = data.Meta?.EffectiveForces?.Wind?.X ?? 0
    this.windY = data.Meta?.EffectiveForces?.Wind?.Y ?? 0

    this.rigs = (data.PhysicsSettings ?? []).map((setting) => {
      const particles: ParticleState[] = setting.Vertices.map((v) => ({
        positionX: v.Position.X,
        positionY: v.Position.Y,
        lastPositionX: v.Position.X,
        lastPositionY: v.Position.Y,
        velocityX: 0,
        velocityY: 0,
        forceX: 0,
        forceY: 0,
        lastGravityX: 0,
        lastGravityY: 1,
        mobility: v.Mobility,
        delay: v.Delay,
        acceleration: v.Acceleration,
        radius: v.Radius,
      }))
      return {
        inputs: setting.Input,
        outputs: setting.Output,
        particles,
        posNorm: {
          min: setting.Normalization?.Position?.Minimum ?? -10,
          def: setting.Normalization?.Position?.Default ?? 0,
          max: setting.Normalization?.Position?.Maximum ?? 10,
        },
        angleNorm: {
          min: setting.Normalization?.Angle?.Minimum ?? -10,
          def: setting.Normalization?.Angle?.Default ?? 0,
          max: setting.Normalization?.Angle?.Maximum ?? 10,
        },
      }
    })
  }

  evaluate(bridge: PhysicsParameterBridge, dtSeconds: number): void {
    const dt = Math.min(Math.max(dtSeconds, 0.001), 0.05)
    const airResistance = 5

    for (const rig of this.rigs) {
      let totalTranslationX = 0
      let totalTranslationY = 0
      let totalAngle = 0

      for (const input of rig.inputs) {
        const range = bridge.getRange(input.Source.Id)
        if (!range) continue
        const raw = bridge.getValue(input.Source.Id)
        const weight = input.Weight / 100
        if (input.Type === "X") {
          totalTranslationX +=
            normalizeParameterValue(
              raw,
              range.min,
              range.max,
              range.def,
              rig.posNorm.min,
              rig.posNorm.max,
              rig.posNorm.def,
              input.Reflect
            ) * weight
        } else if (input.Type === "Y") {
          totalTranslationY +=
            normalizeParameterValue(
              raw,
              range.min,
              range.max,
              range.def,
              rig.posNorm.min,
              rig.posNorm.max,
              rig.posNorm.def,
              input.Reflect
            ) * weight
        } else if (input.Type === "Angle") {
          totalAngle +=
            normalizeParameterValue(
              raw,
              range.min,
              range.max,
              range.def,
              rig.angleNorm.min,
              rig.angleNorm.max,
              rig.angleNorm.def,
              input.Reflect
            ) * weight
        }
      }

      const radAngle = (-totalAngle * Math.PI) / 180
      const cosA = Math.cos(radAngle)
      const sinA = Math.sin(radAngle)
      const rotatedX = totalTranslationX * cosA - totalTranslationY * sinA
      const rotatedY = totalTranslationX * sinA + totalTranslationY * cosA

      const particles = rig.particles
      if (particles.length === 0) continue

      particles[0].positionX = rotatedX
      particles[0].positionY = rotatedY

      const totalRad = (totalAngle * Math.PI) / 180
      const curGravityX = Math.sin(totalRad)
      const curGravityY = Math.cos(totalRad)

      for (let i = 1; i < particles.length; i += 1) {
        const prev = particles[i - 1]
        const cur = particles[i]

        cur.forceX = curGravityX * cur.acceleration + this.windX + this.gravityX * 0
        cur.forceY = curGravityY * cur.acceleration + this.windY - this.gravityY * 0
        cur.lastPositionX = cur.positionX
        cur.lastPositionY = cur.positionY

        const delay = cur.delay * dt * 30
        let dirX = cur.positionX - prev.positionX
        let dirY = cur.positionY - prev.positionY

        const angleDiff = Math.atan2(curGravityY, curGravityX) - Math.atan2(cur.lastGravityY, cur.lastGravityX)
        const clampedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)) / airResistance
        const c = Math.cos(clampedDiff)
        const s = Math.sin(clampedDiff)
        const rdx = dirX * c - dirY * s
        const rdy = dirX * s + dirY * c
        dirX = rdx
        dirY = rdy

        cur.positionX = prev.positionX + dirX + cur.velocityX * delay + cur.forceX * delay * delay
        cur.positionY = prev.positionY + dirY + cur.velocityY * delay + cur.forceY * delay * delay

        const newDx = cur.positionX - prev.positionX
        const newDy = cur.positionY - prev.positionY
        const dist = Math.hypot(newDx, newDy)
        if (dist > 1e-6) {
          const scale = cur.radius / dist
          cur.positionX = prev.positionX + newDx * scale
          cur.positionY = prev.positionY + newDy * scale
        }

        if (Math.abs(cur.positionX) < 1e-4) cur.positionX = 0
        if (delay > 1e-6) {
          cur.velocityX = ((cur.positionX - cur.lastPositionX) / delay) * cur.mobility
          cur.velocityY = ((cur.positionY - cur.lastPositionY) / delay) * cur.mobility
        }
        cur.lastGravityX = curGravityX
        cur.lastGravityY = curGravityY
      }

      for (const output of rig.outputs) {
        const idx = output.VertexIndex
        if (idx < 1 || idx >= particles.length) continue
        const prev = particles[idx - 1]
        const cur = particles[idx]
        const dx = cur.positionX - prev.positionX
        const dy = cur.positionY - prev.positionY
        const parentDx = idx >= 2 ? prev.positionX - particles[idx - 2].positionX : 0
        const parentDy = idx >= 2 ? prev.positionY - particles[idx - 2].positionY : 1

        let outVal = 0
        if (output.Type === "X") {
          outVal = dx
        } else if (output.Type === "Y") {
          outVal = dy
        } else {
          const a1 = Math.atan2(parentDy, parentDx)
          const a2 = Math.atan2(dy, dx)
          let delta = a2 - a1
          while (delta > Math.PI) delta -= Math.PI * 2
          while (delta < -Math.PI) delta += Math.PI * 2
          outVal = delta
        }

        if (output.Reflect) outVal = -outVal
        const scaled = outVal * output.Scale
        const weight = output.Weight / 100
        const range = bridge.getRange(output.Destination.Id)
        if (!range) continue
        const current = bridge.getValue(output.Destination.Id)
        const blended = current * (1 - weight) + scaled * weight
        bridge.setValue(output.Destination.Id, Math.max(range.min, Math.min(range.max, blended)))
      }
    }
  }
}
