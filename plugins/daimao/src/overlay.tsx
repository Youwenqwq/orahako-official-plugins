import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { EyeOff, RotateCcw, Sparkles, UtensilsCrossed } from "lucide-react"
import type { DerivedComponentProps, SlotComponent } from "@orahako/sdk"
import { DaimaoAnimator, type DaimaoAppearanceConfig, type DaimaoReactionKind } from "./animator"
import {
  POSE_BUBBLE_KEY,
  type DaimaoDictionary,
  type PoseBubbleKey,
  type ReactionBubbleKey,
} from "./i18n"
import { createLive2DRenderer, type DaimaoAssetUrls, type Live2DRenderer } from "./renderer"
import { clampDaimaoScale, type DaimaoStoreDefinition } from "./store"

/** Base display dimensions (CSS px at scale = 1.0), matching the 2357:1717 canvas ratio. */
const BASE_WIDTH = 240
const BASE_HEIGHT = 176
const VIEWPORT_MARGIN = 8

export interface DaimaoOverlayInject {
  readonly assets: DaimaoAssetUrls | null
}

export type DaimaoOverlayProps = DerivedComponentProps<
  Record<string, never>,
  DaimaoDictionary,
  undefined,
  DaimaoStoreDefinition,
  DaimaoOverlayInject
>

function viewportBounds(width: number, height: number): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} {
  if (typeof window === "undefined") {
    return { minX: VIEWPORT_MARGIN, maxX: VIEWPORT_MARGIN, minY: VIEWPORT_MARGIN, maxY: VIEWPORT_MARGIN }
  }
  return {
    minX: VIEWPORT_MARGIN,
    maxX: Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
    minY: VIEWPORT_MARGIN,
    maxY: Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN),
  }
}

function clampPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const { minX, maxX, minY, maxY } = viewportBounds(width, height)
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  }
}

function positionFromRatios(
  xRatio: number | null,
  yRatio: number | null,
  width: number,
  height: number
): { x: number; y: number } {
  const { minX, maxX, minY, maxY } = viewportBounds(width, height)
  if (xRatio === null || yRatio === null) {
    return clampPosition(maxX - 8, maxY - 16, width, height)
  }
  return {
    x: Math.round(minX + (maxX - minX) * xRatio),
    y: Math.round(minY + (maxY - minY) * yRatio),
  }
}

function ratiosFromPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { xRatio: number; yRatio: number } {
  const { minX, maxX, minY, maxY } = viewportBounds(width, height)
  const spanX = maxX - minX
  const spanY = maxY - minY
  return {
    xRatio: spanX > 0 ? Math.max(0, Math.min(1, (x - minX) / spanX)) : 1,
    yRatio: spanY > 0 ? Math.max(0, Math.min(1, (y - minY) / spanY)) : 1,
  }
}

export const DaimaoOverlay: SlotComponent<DaimaoOverlayProps> = (props) => {
  const { t, useStore, actions, assets } = props

  const enabled = useStore((s) => s.enabled)
  const scale = useStore((s) => s.scale)
  const xRatio = useStore((s) => s.xRatio)
  const yRatio = useStore((s) => s.yRatio)
  const pose = useStore((s) => s.pose)
  const santaHat = useStore((s) => s.santaHat)
  const showDesk = useStore((s) => s.showDesk)
  const blueDesk = useStore((s) => s.blueDesk)
  const altTea = useStore((s) => s.altTea)
  const altDango = useStore((s) => s.altDango)
  const altDish = useStore((s) => s.altDish)
  const riceBowl = useStore((s) => s.riceBowl)
  const eyeTracking = useStore((s) => s.eyeTracking)
  const speechBubbles = useStore((s) => s.speechBubbles)
  const keyboardReact = useStore((s) => s.keyboardReact)
  const showToolbar = useStore((s) => s.showToolbar)
  const clickThrough = useStore((s) => s.clickThrough)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animatorRef = useRef<DaimaoAnimator | null>(null)
  const rendererRef = useRef<Live2DRenderer | null>(null)

  const [loadError, setLoadError] = useState<string | null>(null)
  const [bubbleText, setBubbleText] = useState<string | null>(null)
  const [scaleHint, setScaleHint] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [viewportTick, setViewportTick] = useState(0)

  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scaleHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTapAtRef = useRef(0)

  // Keep latest appearance config in a ref for the 60fps animation loop
  const configRef = useRef<DaimaoAppearanceConfig>({
    pose,
    santaHat,
    showDesk,
    blueDesk,
    altTea,
    altDango,
    altDish,
    riceBowl,
    eyeTracking,
    keyboardReact,
  })
  configRef.current = {
    pose,
    santaHat,
    showDesk,
    blueDesk,
    altTea,
    altDango,
    altDish,
    riceBowl,
    eyeTracking,
    keyboardReact,
  }

  const width = Math.round(BASE_WIDTH * scale)
  const height = Math.round(BASE_HEIGHT * scale)

  const resolvedPos = dragPos ?? positionFromRatios(xRatio, yRatio, width, height)

  // Keep reference to live scale/pos for event handlers without re-binding listeners
  const layoutRef = useRef({ scale, width, height, x: resolvedPos.x, y: resolvedPos.y })
  layoutRef.current = { scale, width, height, x: resolvedPos.x, y: resolvedPos.y }

  const showBubble = useCallback(
    (key: ReactionBubbleKey | PoseBubbleKey) => {
      if (!speechBubbles) return
      setBubbleText(t(key))
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleText(null)
      }, 2600)
    },
    [speechBubbles, t]
  )

  const flashScaleHint = useCallback((nextScale: number) => {
    setScaleHint(`${Math.round(nextScale * 100)}%`)
    if (scaleHintTimerRef.current) clearTimeout(scaleHintTimerRef.current)
    scaleHintTimerRef.current = setTimeout(() => {
      setScaleHint(null)
    }, 900)
  }, [])

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current)
      if (scaleHintTimerRef.current) clearTimeout(scaleHintTimerRef.current)
    }
  }, [])

  // Re-clamp on viewport resize
  useEffect(() => {
    if (!enabled) return
    const onResize = () => setViewportTick((v) => v + 1)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [enabled])

  // Initialize WebGL Live2D renderer & 60fps animation loop
  useEffect(() => {
    if (!enabled || !assets || !canvasRef.current) return

    let cancelled = false
    let rafId = 0
    let lastTime = performance.now()
    const canvas = canvasRef.current
    const animator = new DaimaoAnimator()
    animatorRef.current = animator
    setLoadError(null)

    void createLive2DRenderer(canvas, assets)
      .then((renderer) => {
        if (cancelled) {
          renderer.dispose()
          return
        }
        rendererRef.current = renderer
        const { width: w, height: h } = layoutRef.current
        renderer.resize(w, h, window.devicePixelRatio || 1)

        const frame = (now: number) => {
          if (cancelled) return
          const dt = Math.min((now - lastTime) / 1000, 0.05)
          lastTime = now
          if (!document.hidden) {
            animator.update(dt, configRef.current, renderer)
            renderer.stepPhysics(dt)
            renderer.render()
          }
          rafId = requestAnimationFrame(frame)
        }
        lastTime = performance.now()
        rafId = requestAnimationFrame(frame)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error))
        }
      })

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      rendererRef.current?.dispose()
      rendererRef.current = null
      animatorRef.current = null
    }
  }, [enabled, assets])

  // Resize WebGL backing buffer whenever scale changes
  useEffect(() => {
    rendererRef.current?.resize(width, height, window.devicePixelRatio || 1)
  }, [width, height, viewportTick])

  // Global gaze tracking + Bongo-Cat keyboard/mouse reactivity
  useEffect(() => {
    if (!enabled) return

    const onPointerMove = (event: PointerEvent) => {
      const animator = animatorRef.current
      if (!animator) return
      const { x, y, width: w, height: h } = layoutRef.current
      const centerX = x + w * 0.5
      const centerY = y + h * 0.45
      const normX = (event.clientX - centerX) / Math.max(window.innerWidth * 0.45, 220)
      const normY = (centerY - event.clientY) / Math.max(window.innerHeight * 0.45, 220)
      animator.setGazeTarget(normX, normY)
    }

    const onPointerDown = (event: PointerEvent) => {
      const animator = animatorRef.current
      if (!animator) return
      animator.setPointerButtons((event.buttons & 1) !== 0, (event.buttons & 2) !== 0)
    }

    const onPointerUp = (event: PointerEvent) => {
      const animator = animatorRef.current
      if (!animator) return
      animator.setPointerButtons((event.buttons & 1) !== 0, (event.buttons & 2) !== 0)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      animatorRef.current?.setKeyPressed(event.code, true)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      animatorRef.current?.setKeyPressed(event.code, false)
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown, { passive: true })
    window.addEventListener("pointerup", onPointerUp, { passive: true })
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [enabled])

  // PC Mouse Wheel + Mobile Two-Finger Pinch-to-Zoom on the cat container
  useEffect(() => {
    const el = containerRef.current
    if (!enabled || clickThrough || !el) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const factor = event.deltaY < 0 ? 1.08 : 0.92
      const next = clampDaimaoScale(layoutRef.current.scale * factor)
      if (next !== layoutRef.current.scale) {
        actions.setScale(next)
        flashScaleHint(next)
      }
    }

    let pinchStartDist = 0
    let pinchStartScale = 1

    const touchDistance = (touches: TouchList): number => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault()
        pinchStartDist = touchDistance(event.touches)
        pinchStartScale = layoutRef.current.scale
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinchStartDist > 10) {
        event.preventDefault()
        const ratio = touchDistance(event.touches) / pinchStartDist
        const next = clampDaimaoScale(pinchStartScale * ratio)
        actions.setScale(next)
        flashScaleHint(next)
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        pinchStartDist = 0
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("touchstart", onTouchStart, { passive: false })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", onTouchEnd)
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [enabled, clickThrough, actions, flashScaleHint])

  // Pointer drag + click/double-tap interaction
  const dragStateRef = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    startPosX: number
    startPosY: number
    lastPosX: number
    lastPosY: number
    moved: boolean
  } | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (clickThrough || event.button !== 0) return
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Ignore synthetic/already-released pointer capture errors
    }
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosX: layoutRef.current.x,
      startPosY: layoutRef.current.y,
      lastPosX: layoutRef.current.x,
      lastPosY: layoutRef.current.y,
      moved: false,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startClientX
    const dy = event.clientY - drag.startClientY
    if (!drag.moved && Math.hypot(dx, dy) > 6) {
      drag.moved = true
      setDragging(true)
    }
    if (drag.moved) {
      const next = clampPosition(
        drag.startPosX + dx,
        drag.startPosY + dy,
        layoutRef.current.width,
        layoutRef.current.height
      )
      drag.lastPosX = next.x
      drag.lastPosY = next.y
      setDragPos(next)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragStateRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (drag.moved) {
      setDragging(false)
      const { xRatio: nextXRatio, yRatio: nextYRatio } = ratiosFromPosition(
        drag.lastPosX,
        drag.lastPosY,
        layoutRef.current.width,
        layoutRef.current.height
      )
      actions.setPositionRatio(nextXRatio, nextYRatio)
      setDragPos(null)
      return
    }

    // Tap / Click interaction!
    const now = Date.now()
    if (now - lastTapAtRef.current < 320) {
      lastTapAtRef.current = 0
      const nextPose = actions.cyclePose()
      animatorRef.current?.triggerReaction("starry", 1.8)
      showBubble(POSE_BUBBLE_KEY[nextPose])
      return
    }
    lastTapAtRef.current = now

    const rect = event.currentTarget.getBoundingClientRect()
    const normalizedY = (event.clientY - rect.top) / Math.max(1, rect.height)
    const reaction: DaimaoReactionKind = animatorRef.current?.triggerTap(normalizedY) ?? "pat"
    showBubble(`bubbles.${reaction}`)
  }

  const handleTriggerSparkle = () => {
    const reactions: readonly DaimaoReactionKind[] = [
      "starry",
      "eureka",
      "dizzy",
      "serious",
      "awkward",
      "questionWhite",
      "pat",
    ]
    const pick = reactions[Math.floor(Math.random() * reactions.length)]
    animatorRef.current?.triggerReaction(pick, 3.0)
    showBubble(`bubbles.${pick}`)
  }

  if (!enabled || !assets) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none"
      aria-hidden={clickThrough}
    >
      <div
        ref={containerRef}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && !clickThrough) setShowControls(true)
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setShowControls(false)
        }}
        style={{
          transform: `translate3d(${resolvedPos.x}px, ${resolvedPos.y}px, 0)`,
          width,
          height,
        }}
        className={
          clickThrough
            ? "pointer-events-none relative"
            : "pointer-events-auto relative touch-none"
        }
      >
        {/* Speech bubble */}
        {bubbleText && (
          <div className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-md backdrop-blur-md">
            {bubbleText}
          </div>
        )}

        {/* Temporary zoom scale pill */}
        {scaleHint && (
          <div className="pointer-events-none absolute top-2 right-2 z-20 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            {scaleHint}
          </div>
        )}

        {/* Live2D WebGL Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ width, height }}
          className={
            clickThrough
              ? "block"
              : dragging
                ? "block cursor-grabbing"
                : "block cursor-grab"
          }
        />

        {loadError && (
          <div className="absolute inset-x-2 bottom-2 rounded-md bg-destructive/90 px-2 py-1 text-[10px] text-destructive-foreground shadow">
            {loadError}
          </div>
        )}

        {/* Compact desktop-hover quick-action pill bar (hidden on touch devices or when disabled) */}
        {showToolbar && !clickThrough && showControls && (
          <div className="absolute -bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/60 bg-background/85 px-1.5 py-1 shadow-md backdrop-blur-md">
            <button
              type="button"
              title={t("quick.cyclePose")}
              onClick={() => {
                const nextPose = actions.cyclePose()
                showBubble(POSE_BUBBLE_KEY[nextPose])
              }}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <UtensilsCrossed className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("quick.sparkle")}
              onClick={handleTriggerSparkle}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Sparkles className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("quick.reset")}
              onClick={() => {
                actions.resetLayout()
                flashScaleHint(1)
              }}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("quick.hide")}
              onClick={() => actions.setEnabled(false)}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <EyeOff className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
