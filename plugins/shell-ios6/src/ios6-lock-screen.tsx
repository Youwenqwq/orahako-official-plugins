import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { computeSlideUnlockProgress } from "./springboard"

export interface Ios6LockScreenProps {
  readonly wallpaperClass: string
  readonly locale: string
  readonly showStatusBar: boolean
  readonly respectSafeArea: boolean
  readonly clockTitle: string
  readonly dateLabel: (date: Date) => string
  readonly slideLabel: string
  readonly slideHint: string
  readonly onUnlock: () => void
  readonly statusBarNode?: ReactNode
}

function formatLockTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function Ios6LockScreen({
  wallpaperClass,
  showStatusBar,
  respectSafeArea,
  dateLabel,
  slideLabel,
  slideHint,
  onUnlock,
  statusBarNode,
}: Ios6LockScreenProps): ReactNode {
  const [now, setNow] = useState(() => new Date())
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const trackRef = useRef<HTMLDivElement | null>(null)
  const knobRef = useRef<HTMLButtonElement | null>(null)
  const dragStateRef = useRef<{
    pointerId: number | null
    startX: number
    trackWidth: number
    knobWidth: number
    moved: boolean
  }>({
    pointerId: null,
    startX: 0,
    trackWidth: 260,
    knobWidth: 66,
    moved: false,
  })

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const triggerUnlock = useCallback(() => {
    if (unlocking) return
    setUnlocking(true)
    const trackWidth = trackRef.current?.clientWidth ?? 260
    const knobWidth = knobRef.current?.clientWidth ?? 66
    const { offsetPx } = computeSlideUnlockProgress(trackWidth, trackWidth, knobWidth)
    setDragOffset(offsetPx)
    window.setTimeout(() => {
      onUnlock()
    }, 180)
  }, [onUnlock, unlocking])

  const handleClick = useCallback(() => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false
      return
    }
    triggerUnlock()
  }, [triggerUnlock])

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (unlocking) return
      e.preventDefault()
      const trackWidth = trackRef.current?.clientWidth ?? 260
      const knobWidth = knobRef.current?.clientWidth ?? 66
      dragStateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        trackWidth,
        knobWidth,
        moved: false,
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    },
    [unlocking]
  )

  const handlePointerMove = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current
    if (state.pointerId !== e.pointerId) return
    const delta = e.clientX - state.startX
    if (Math.abs(delta) > 4) {
      state.moved = true
    }
    const { offsetPx } = computeSlideUnlockProgress(delta, state.trackWidth, state.knobWidth)
    setDragOffset(offsetPx)
  }, [])

  const finishDrag = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      const state = dragStateRef.current
      if (state.pointerId !== e.pointerId) return
      state.pointerId = null
      setDragging(false)
      const delta = e.clientX - state.startX
      const { unlocked } = computeSlideUnlockProgress(delta, state.trackWidth, state.knobWidth)
      // Clicking the knob without dragging also unlocks cleanly for mouse/accessibility convenience
      if (unlocked || !state.moved) {
        triggerUnlock()
      } else {
        setDragOffset(0)
      }
    },
    [triggerUnlock]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        e.preventDefault()
        triggerUnlock()
      }
    },
    [triggerUnlock]
  )

  const labelOpacity = Math.max(0, 1 - dragOffset / 90)

  return (
    <div
      className={`relative flex size-full flex-col justify-between overflow-hidden ${wallpaperClass} transition-opacity duration-200 ${
        unlocking ? "opacity-0" : "opacity-100"
      }`}
      data-testid="ios6-lock-screen"
    >
      {/* Top Status Bar + Classic Translucent Clock Band */}
      <div className="relative z-10 w-full">
        {showStatusBar ? (
          statusBarNode
        ) : (
          <div
            aria-hidden="true"
            style={{ height: respectSafeArea ? "var(--ios6-safe-top)" : "0px" }}
          />
        )}
        <div className="ios6-lock-top-panel flex flex-col items-center justify-center px-4 py-3 text-center">
          <div
            className="text-[64px] leading-[1.02] font-extralight tracking-[-2px] text-white tabular-nums"
            style={{ textShadow: "0 -1px 0 rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.35)" }}
          >
            {formatLockTime(now)}
          </div>
          <div
            className="mt-1 text-[15px] font-normal tracking-wide text-white/90"
            style={{ textShadow: "0 -1px 0 rgba(0,0,0,0.75)" }}
          >
            {dateLabel(now)}
          </div>
        </div>
      </div>

      {/* Subtle center breathing space + hint */}
      <div className="pointer-events-none flex flex-1 items-end justify-center pb-3">
        <span
          className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-medium text-white/75 backdrop-blur-xs"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
        >
          {slideHint}
        </span>
      </div>

      {/* Bottom Slide-to-Unlock Dock */}
      <div
        className="ios6-lock-bottom-panel relative z-10 w-full px-5 pt-4"
        style={{
          paddingBottom: respectSafeArea ? "max(20px, calc(12px + var(--ios6-safe-bottom)))" : "20px",
          paddingLeft: respectSafeArea ? "max(20px, var(--ios6-safe-left))" : "20px",
          paddingRight: respectSafeArea ? "max(20px, var(--ios6-safe-right))" : "20px",
        }}
      >
        <div
          ref={trackRef}
          className="ios6-slide-track relative mx-auto flex h-[50px] w-full max-w-[300px] items-center rounded-[12px] p-[4px]"
        >
          {/* Shimmering Slide to Unlock Prompt */}
          <div
            className="pointer-events-none absolute inset-y-0 right-3 left-[72px] flex items-center justify-center overflow-hidden"
            style={{ opacity: labelOpacity }}
          >
            <span className="ios6-slide-text truncate text-[19px] font-normal tracking-wide">
              {slideLabel}
            </span>
          </div>

          {/* Silver Glossy Slider Knob */}
          <button
            ref={knobRef}
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={slideLabel}
            data-testid="ios6-slide-knob"
            className={`ios6-slide-knob relative z-10 flex h-[40px] w-[66px] cursor-grab items-center justify-center rounded-[9px] active:cursor-grabbing ${
              dragging ? "" : "transition-transform duration-200 ease-out"
            }`}
            style={{ transform: `translateX(${dragOffset}px)` }}
          >
            {/* Classic chunky metallic right arrow SVG */}
            <svg viewBox="0 0 28 22" width="24" height="19" aria-hidden="true">
              <defs>
                <linearGradient id="ios6-arrow-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9fa6ae" />
                  <stop offset="50%" stopColor="#727982" />
                  <stop offset="100%" stopColor="#585e66" />
                </linearGradient>
              </defs>
              <path
                d="M3 8 H14 V3.5 L25 11 L14 18.5 V14 H3 Z"
                fill="url(#ios6-arrow-grad)"
                stroke="#43484f"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
