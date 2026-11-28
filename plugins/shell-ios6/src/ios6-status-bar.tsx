import { useEffect, useState, type ReactNode } from "react"
import { Lock } from "lucide-react"

export interface Ios6StatusBarProps {
  readonly locked?: boolean
  readonly carrierLabel?: string
  readonly respectSafeAreaTop?: boolean
  readonly overlay?: boolean
}

function formatClock(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

export function Ios6StatusBar({
  locked = false,
  carrierLabel = "Orahako",
  respectSafeAreaTop = true,
  overlay = false,
}: Ios6StatusBarProps): ReactNode {
  const [timeText, setTimeText] = useState(() => formatClock(new Date()))

  useEffect(() => {
    const update = () => setTimeText(formatClock(new Date()))
    update()
    const timer = window.setInterval(update, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className={`ios6-status-bar z-30 flex w-full shrink-0 items-end justify-between px-2.5 pb-[2px] text-[11px] leading-[18px] font-semibold text-white select-none ${
        overlay ? "absolute inset-x-0 top-0" : "relative"
      }`}
      style={{
        paddingTop: respectSafeAreaTop ? "var(--ios6-safe-top)" : "0px",
        minHeight: respectSafeAreaTop ? "calc(22px + var(--ios6-safe-top))" : "22px",
        paddingLeft: "max(10px, var(--ios6-safe-left))",
        paddingRight: "max(10px, var(--ios6-safe-right))",
      }}
      data-testid="ios6-status-bar"
    >
      {/* Left: Signal dots + Carrier + Wi-Fi */}
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="inline-flex items-end gap-[1.5px]" aria-hidden="true">
          <span className="h-[3px] w-[2.5px] rounded-[0.5px] bg-white" />
          <span className="h-[5px] w-[2.5px] rounded-[0.5px] bg-white" />
          <span className="h-[7px] w-[2.5px] rounded-[0.5px] bg-white" />
          <span className="h-[9px] w-[2.5px] rounded-[0.5px] bg-white" />
          <span className="h-[11px] w-[2.5px] rounded-[0.5px] bg-white/45" />
        </span>
        <span className="truncate font-semibold tracking-tight">{carrierLabel}</span>
        {/* Classic Wi-Fi fan SVG */}
        <svg viewBox="0 0 16 12" width="13" height="10" className="shrink-0" aria-hidden="true">
          <path
            d="M1 3.5 C4.8 0.5 11.2 0.5 15 3.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M3.6 6.4 C6 4.4 10 4.4 12.4 6.4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="8" cy="10" r="1.4" fill="#ffffff" />
        </svg>
      </div>

      {/* Center: Lock icon or Time */}
      <div className="flex items-center justify-center font-bold tracking-tight tabular-nums">
        {locked ? (
          <Lock className="size-3 text-white" strokeWidth={2.5} aria-label="Locked" />
        ) : (
          <span>{timeText}</span>
        )}
      </div>

      {/* Right: Battery % + Classic glossy green battery */}
      <div className="flex items-center gap-1">
        <span className="text-[10.5px] tabular-nums">100%</span>
        <span className="relative inline-flex items-center" aria-hidden="true">
          <span className="relative flex h-[10px] w-[20px] items-center rounded-[2px] border border-white/80 bg-black/50 p-[1px]">
            <span
              className="block h-full w-full rounded-[1px]"
              style={{
                background: "linear-gradient(180deg, #98f060 0%, #4ec61e 50%, #2b8e0d 100%)",
              }}
            />
          </span>
          <span className="h-[4px] w-[1.5px] rounded-r-[1px] bg-white/80" />
        </span>
      </div>
    </div>
  )
}
