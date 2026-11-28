import { useId, type ComponentType, type CSSProperties, type ReactNode } from "react"
import type { Ios6IconKind } from "./springboard"

export interface Ios6IconProps {
  readonly kind: Ios6IconKind
  readonly size?: number
  readonly badgeCount?: number
  readonly badgeComponent?: ComponentType
  readonly glossy?: boolean
  readonly className?: string
  readonly style?: CSSProperties
}

function getTodayLabel(): { readonly weekday: string; readonly day: string } {
  const now = new Date()
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  return {
    weekday: weekdays[now.getDay()] ?? "DAY",
    day: String(now.getDate()),
  }
}

function IconGlyphSvg({ kind, size }: { readonly kind: Ios6IconKind; readonly size: number }): ReactNode {
  const uid = useId().replace(/:/g, "")

  switch (kind) {
    case "calendar": {
      const { weekday, day } = getTodayLabel()
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cal-top`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef5a52" />
              <stop offset="48%" stopColor="#d32820" />
              <stop offset="100%" stopColor="#9d110a" />
            </linearGradient>
            <linearGradient id={`${uid}-cal-paper`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#f2f3f5" />
              <stop offset="100%" stopColor="#dcdfe4" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-cal-paper)`} />
          <rect width="64" height="19" fill={`url(#${uid}-cal-top)`} />
          <rect y="18.5" width="64" height="1.5" fill="#700b06" />
          <text
            x="32"
            y="13.5"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9.5"
            fontWeight="700"
            fontFamily="Helvetica Neue, Arial, sans-serif"
            letterSpacing="0.8"
          >
            {weekday}
          </text>
          <text
            x="32"
            y="52"
            textAnchor="middle"
            fill="#22252a"
            fontSize="33"
            fontWeight="700"
            fontFamily="Helvetica Neue, Arial, sans-serif"
            letterSpacing="-1"
          >
            {day}
          </text>
        </svg>
      )
    }

    case "timetable":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-tt-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#355d8f" />
              <stop offset="100%" stopColor="#1b3457" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-tt-bg)`} />
          {/* Spiral rings & cream timetable sheet */}
          <rect x="8" y="12" width="48" height="44" rx="4" fill="#f7f9fc" stroke="#132540" strokeWidth="1.5" />
          <rect x="8" y="12" width="48" height="10" rx="3" fill="#4f82c4" />
          {[14, 24, 34, 44, 50].map((x) => (
            <rect key={x} x={x - 1.5} y="8" width="3" height="7" rx="1.5" fill="#cfd6df" stroke="#1b304d" strokeWidth="0.8" />
          ))}
          {/* Colored schedule blocks */}
          <rect x="13" y="26" width="11" height="11" rx="2" fill="#54b86a" />
          <rect x="26.5" y="26" width="11" height="16" rx="2" fill="#f29f38" />
          <rect x="40" y="26" width="11" height="9" rx="2" fill="#529de8" />
          <rect x="13" y="40" width="11" height="11" rx="2" fill="#e65c53" />
          <rect x="40" y="38" width="11" height="13" rx="2" fill="#8b6cd9" />
        </svg>
      )

    case "overview":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ov-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2659a4" />
              <stop offset="55%" stopColor="#163b75" />
              <stop offset="100%" stopColor="#0d234a" />
            </linearGradient>
            <linearGradient id={`${uid}-ov-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#65d4ff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#65d4ff" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-ov-bg)`} />
          {[14, 26, 38, 50].map((pos) => (
            <line key={`h-${pos}`} x1="0" y1={pos} x2="64" y2={pos} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          ))}
          {[16, 32, 48].map((pos) => (
            <line key={`v-${pos}`} x1={pos} y1="0" x2={pos} y2="64" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          ))}
          <path d="M0 44 L14 38 L24 42 L36 24 L46 28 L56 15 L64 18 L64 64 L0 64 Z" fill={`url(#${uid}-ov-fill)`} />
          <path
            d="M0 44 L14 38 L24 42 L36 24 L46 28 L56 15 L64 18"
            fill="none"
            stroke="#b8ecff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="24" r="3" fill="#ffffff" />
          <circle cx="56" cy="15" r="3.5" fill="#ffffff" />
        </svg>
      )

    case "grades":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-calc-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c4f54" />
              <stop offset="100%" stopColor="#26282b" />
            </linearGradient>
            <linearGradient id={`${uid}-calc-lcd`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c5d6b8" />
              <stop offset="100%" stopColor="#9eb38e" />
            </linearGradient>
            <linearGradient id={`${uid}-calc-eq`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffa238" />
              <stop offset="100%" stopColor="#db6300" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-calc-bg)`} />
          <rect x="8" y="8" width="48" height="15" rx="3" fill={`url(#${uid}-calc-lcd)`} stroke="#151719" strokeWidth="1.5" />
          <text
            x="51"
            y="19"
            textAnchor="end"
            fill="#1e2b18"
            fontSize="11"
            fontWeight="700"
            fontFamily="monospace"
          >
            4.0 A+
          </text>
          <rect x="8" y="27" width="21" height="14" rx="3.5" fill="#d9dde2" stroke="#18191b" strokeWidth="1" />
          <rect x="35" y="27" width="21" height="14" rx="3.5" fill="#d9dde2" stroke="#18191b" strokeWidth="1" />
          <rect x="8" y="44" width="21" height="14" rx="3.5" fill="#d9dde2" stroke="#18191b" strokeWidth="1" />
          <rect x="35" y="44" width="21" height="14" rx="3.5" fill={`url(#${uid}-calc-eq)`} stroke="#5d2600" strokeWidth="1" />
          <text x="18.5" y="37.5" textAnchor="middle" fill="#2b2e33" fontSize="13" fontWeight="700">+</text>
          <text x="45.5" y="37.5" textAnchor="middle" fill="#2b2e33" fontSize="13" fontWeight="700">×</text>
          <text x="18.5" y="54.5" textAnchor="middle" fill="#2b2e33" fontSize="13" fontWeight="700">−</text>
          <text x="45.5" y="54.5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">=</text>
        </svg>
      )

    case "trophy":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-tr-bg`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#7752c7" />
              <stop offset="65%" stopColor="#4c2c91" />
              <stop offset="100%" stopColor="#2b175c" />
            </radialGradient>
            <linearGradient id={`${uid}-tr-gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff0a6" />
              <stop offset="45%" stopColor="#f5bc2e" />
              <stop offset="100%" stopColor="#b57107" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-tr-bg)`} />
          <path d="M18 16 H46 V28 C46 36 40 41 32 41 C24 41 18 36 18 28 Z" fill={`url(#${uid}-tr-gold)`} stroke="#693e00" strokeWidth="1.2" />
          <path d="M18 19 H12 C12 27 15 31 19 31" fill="none" stroke="#f5bc2e" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M46 19 H52 C52 27 49 31 45 31" fill="none" stroke="#f5bc2e" strokeWidth="2.8" strokeLinecap="round" />
          <rect x="29" y="41" width="6" height="8" fill="#d99714" />
          <rect x="21" y="49" width="22" height="5" rx="2" fill={`url(#${uid}-tr-gold)`} stroke="#693e00" strokeWidth="1" />
        </svg>
      )

    case "star":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-st-bg`} cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="#ffb845" />
              <stop offset="62%" stopColor="#e87312" />
              <stop offset="100%" stopColor="#a83b00" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-st-bg)`} />
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="2" />
          <polygon
            points="32,12 37.8,24.2 51.2,26 41.4,35.4 43.8,48.8 32,42.3 20.2,48.8 22.6,35.4 12.8,26 26.2,24.2"
            fill="#ffffff"
            stroke="#8a3200"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      )

    case "clock":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-clk-bezel`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3e4248" />
              <stop offset="100%" stopColor="#141619" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-clk-bezel)`} />
          <circle cx="32" cy="32" r="24" fill="#fafafa" stroke="#808690" strokeWidth="2" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="11"
              x2="32"
              y2={deg % 90 === 0 ? "15.5" : "13.5"}
              stroke="#22252a"
              strokeWidth={deg % 90 === 0 ? "2.2" : "1.2"}
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <line x1="32" y1="32" x2="23" y2="23" stroke="#1c1e22" strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="32" x2="43" y2="20" stroke="#1c1e22" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="32" y1="37" x2="32" y2="14" stroke="#df241b" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="2.8" fill="#df241b" />
        </svg>
      )

    case "reminders":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-rem-paper`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#eceef2" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-rem-paper)`} />
          <rect width="64" height="11" fill="#e0e4ea" />
          <line x1="0" y1="11" x2="64" y2="11" stroke="#b6bec9" strokeWidth="1" />
          {[22, 34, 46, 58].map((y) => (
            <line key={y} x1="0" y1={y} x2="64" y2={y} stroke="#d4dbe4" strokeWidth="1" />
          ))}
          <circle cx="14" cy="17" r="4" fill="none" stroke="#e23d32" strokeWidth="1.8" />
          <circle cx="14" cy="17" r="1.8" fill="#e23d32" />
          <circle cx="14" cy="29" r="4" fill="none" stroke="#f08b1d" strokeWidth="1.8" />
          <circle cx="14" cy="41" r="4" fill="none" stroke="#2c84de" strokeWidth="1.8" />
          <circle cx="14" cy="53" r="4" fill="none" stroke="#45b549" strokeWidth="1.8" />
          <path d="M23 17 H52 M23 29 H48 M23 41 H54 M23 53 H44" stroke="#535c69" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )

    case "ibooks":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ib-wood`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2aa63" />
              <stop offset="50%" stopColor="#b97732" />
              <stop offset="100%" stopColor="#7a4616" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-ib-wood)`} />
          {/* Shelf planks */}
          <rect y="50" width="64" height="6" fill="#63360e" opacity="0.65" />
          {/* Open classic hardcover book */}
          <path d="M10 15 C19 12 27 14 32 18 C37 14 45 12 54 15 V47 C45 44 37 46 32 50 C27 46 19 44 10 47 Z" fill="#fffaf0" stroke="#54300c" strokeWidth="1.8" />
          <line x1="32" y1="18" x2="32" y2="50" stroke="#c9b496" strokeWidth="1.5" />
          <path d="M15 23 H27 M15 29 H27 M15 35 H25 M37 23 H49 M37 29 H49 M37 35 H46" stroke="#8a745c" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )

    case "notes":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-notes-top`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7b4a2b" />
              <stop offset="50%" stopColor="#5a3219" />
              <stop offset="100%" stopColor="#3c1e0d" />
            </linearGradient>
            <linearGradient id={`${uid}-notes-pad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff7a8" />
              <stop offset="100%" stopColor="#f5e36e" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-notes-pad)`} />
          <rect width="64" height="18" fill={`url(#${uid}-notes-top)`} />
          <line x1="4" y1="14.5" x2="60" y2="14.5" stroke="#c89a6f" strokeWidth="1" strokeDasharray="3 2" />
          <rect y="18" width="64" height="2" fill="rgba(0,0,0,0.22)" />
          <line x1="14" y1="18" x2="14" y2="64" stroke="#d95b5b" strokeWidth="1.2" opacity="0.65" />
          {[28, 36, 44, 52, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="64" y2={y} stroke="#c2b35e" strokeWidth="1" />
          ))}
          <path d="M20 33 L46 33 M20 41 L52 41 M20 49 L40 49" stroke="#4f3e19" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
        </svg>
      )

    case "passbook":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-pb-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4e5259" />
              <stop offset="100%" stopColor="#2c2f34" />
            </linearGradient>
            <linearGradient id={`${uid}-pb-blue`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4db6f7" />
              <stop offset="100%" stopColor="#1b6db8" />
            </linearGradient>
            <linearGradient id={`${uid}-pb-green`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#72d14e" />
              <stop offset="100%" stopColor="#358f23" />
            </linearGradient>
            <linearGradient id={`${uid}-pb-orange`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff9b3d" />
              <stop offset="100%" stopColor="#d15b0c" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-pb-bg)`} />
          <rect x="8" y="10" width="48" height="22" rx="4" fill={`url(#${uid}-pb-blue)`} />
          <rect x="8" y="21" width="48" height="22" rx="4" fill={`url(#${uid}-pb-green)`} />
          <rect x="8" y="32" width="48" height="24" rx="4" fill={`url(#${uid}-pb-orange)`} />
          <path d="M0 44 L23 44 C26 44 27 48 32 48 C37 48 38 44 41 44 L64 44 L64 64 L0 64 Z" fill="#23252a" />
          <path d="M0 44 L23 44 C26 44 27 48 32 48 C37 48 38 44 41 44 L64 44" fill="none" stroke="#62666e" strokeWidth="1.2" />
          <circle cx="18" cy="17" r="2.2" fill="rgba(255,255,255,0.85)" />
          <rect x="24" y="15.5" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.75)" />
          <rect x="15" y="27" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.85)" />
          <rect x="15" y="38" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.9)" />
        </svg>
      )

    case "wallet":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-wl-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ca66f" />
              <stop offset="100%" stopColor="#125e3c" />
            </linearGradient>
            <linearGradient id={`${uid}-wl-coin`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe580" />
              <stop offset="100%" stopColor="#d18e12" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-wl-bg)`} />
          <rect x="9" y="16" width="46" height="33" rx="5" fill="#17402d" stroke="#85e0b3" strokeWidth="1.5" />
          <rect x="9" y="22" width="46" height="6" fill="#0d291c" />
          <circle cx="42" cy="39" r="10" fill={`url(#${uid}-wl-coin)`} stroke="#8a5700" strokeWidth="1.5" />
          <text x="42" y="43" textAnchor="middle" fill="#6b4000" fontSize="12" fontWeight="800">¥</text>
          <rect x="15" y="34" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.75)" />
          <rect x="15" y="40" width="10" height="3" rx="1.5" fill="rgba(255,255,255,0.5)" />
        </svg>
      )

    case "meter":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-mt-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#207a9c" />
              <stop offset="100%" stopColor="#0e3b54" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-mt-bg)`} />
          <circle cx="32" cy="34" r="21" fill="#102533" stroke="#9be2ff" strokeWidth="2.5" />
          <path d="M18 40 A16 16 0 1 1 46 40" fill="none" stroke="#4ed2ff" strokeWidth="3" strokeLinecap="round" />
          <polygon points="34,19 25,35 32,35 29,48 40,31 33,31" fill="#ffd942" stroke="#9c6b00" strokeWidth="0.9" />
        </svg>
      )

    case "charge":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ch-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#383d44" />
              <stop offset="100%" stopColor="#16191d" />
            </linearGradient>
            <linearGradient id={`${uid}-ch-cell`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b0ff6b" />
              <stop offset="48%" stopColor="#46d41c" />
              <stop offset="100%" stopColor="#228a06" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-ch-bg)`} />
          <rect x="25" y="9" width="14" height="5" rx="2" fill="#c7cdd4" />
          <rect x="17" y="13" width="30" height="42" rx="5" fill="#101215" stroke="#aab2bc" strokeWidth="2" />
          <rect x="20" y="21" width="24" height="31" rx="3" fill={`url(#${uid}-ch-cell)`} />
          <polygon points="34,24 26,37 32,37 30,49 38,34 32,34" fill="#ffffff" />
        </svg>
      )

    case "maps":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <rect width="64" height="64" fill="#efe6cf" />
          <path d="M0 0 L28 0 L20 26 L0 22 Z" fill="#b6d99a" />
          <path d="M40 38 C48 34 56 42 64 36 L64 64 L36 64 Z" fill="#82bdf0" />
          <path d="M0 32 L64 22" stroke="#ffffff" strokeWidth="7" />
          <path d="M0 32 L64 22" stroke="#f5c342" strokeWidth="3.5" />
          <path d="M26 0 L34 64" stroke="#ffffff" strokeWidth="6" />
          <path d="M26 0 L34 64" stroke="#d8d0bc" strokeWidth="1" />
          <circle cx="43" cy="21" r="8.5" fill="#d92b21" stroke="#7d0f0a" strokeWidth="1.5" />
          <circle cx="40.5" cy="18.5" r="2.5" fill="#ff9e96" />
          <line x1="43" y1="29.5" x2="43" y2="39" stroke="#333" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )

    case "messages":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-msg-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#83eb4d" />
              <stop offset="55%" stopColor="#3ec41a" />
              <stop offset="100%" stopColor="#1e8e09" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-msg-bg)`} />
          <path
            d="M32 14 C18.5 14 8 22.3 8 32.5 C8 38.2 11.4 43.3 16.8 46.7 C16 50.4 13.7 53 11.5 54.5 C16.3 54.8 21.5 53 24.7 50.4 C27 51 29.5 51.3 32 51.3 C45.5 51.3 56 43 56 32.5 C56 22.3 45.5 14 32 14 Z"
            fill="#ffffff"
            filter="drop-shadow(0 2px 2px rgba(0,0,0,0.28))"
          />
        </svg>
      )

    case "mail":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-mail-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#308be8" />
              <stop offset="60%" stopColor="#65b8f7" />
              <stop offset="100%" stopColor="#a7dcff" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-mail-bg)`} />
          <rect x="10" y="18" width="44" height="28" rx="3" fill="#ffffff" stroke="#2d669e" strokeWidth="1.2" />
          <path d="M11 19 L32 35 L53 19" fill="none" stroke="#8cb2d9" strokeWidth="2" />
          <path d="M11 45 L25 31 M53 45 L39 31" fill="none" stroke="#b3cde6" strokeWidth="1.6" />
        </svg>
      )

    case "safari":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-saf-ring`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f2f4f7" />
              <stop offset="100%" stopColor="#9aa2ad" />
            </linearGradient>
            <radialGradient id={`${uid}-saf-dial`} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#4ec4ff" />
              <stop offset="70%" stopColor="#1d74d1" />
              <stop offset="100%" stopColor="#0e458c" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-saf-ring)`} />
          <circle cx="32" cy="32" r="24" fill={`url(#${uid}-saf-dial)`} stroke="#555e69" strokeWidth="1.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="10"
              x2="32"
              y2="14"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="1.5"
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <polygon points="32,27 46,16 37,32" fill="#ea3326" />
          <polygon points="32,27 18,48 37,32" fill="#ffffff" />
          <circle cx="32" cy="32" r="2.5" fill="#d8dde4" />
        </svg>
      )

    case "compass":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cmp-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c727a" />
              <stop offset="100%" stopColor="#2e3238" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-cmp-bg)`} />
          <circle cx="32" cy="32" r="23" fill="#121417" stroke="#c7ccd4" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="32"
              y1="11"
              x2="32"
              y2={deg % 90 === 0 ? "15.5" : "13.5"}
              stroke="#d5dbe3"
              strokeWidth={deg % 90 === 0 ? "2" : "1"}
              transform={`rotate(${deg} 32 32)`}
            />
          ))}
          <polygon points="32,15 36.5,32 27.5,32" fill="#e6352b" />
          <polygon points="32,49 36.5,32 27.5,32" fill="#e4e8ed" />
          <circle cx="32" cy="32" r="2.6" fill="#9ea5af" />
        </svg>
      )

    case "weather":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-wt-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b7be4" />
              <stop offset="100%" stopColor="#72bdfc" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-wt-bg)`} />
          <circle cx="23" cy="24" r="11" fill="#ffd947" stroke="#f5a623" strokeWidth="1.5" />
          <path d="M22 46 H46 C50.5 46 54 42.5 54 38 C54 33.8 50.8 30.4 46.7 30 C45.4 24.8 40.7 21 35 21 C28.5 21 23.2 26 23 32.4 C18.8 33.1 15.8 36.7 15.8 41 C15.8 43.8 18.4 46 22 46 Z" fill="#ffffff" />
        </svg>
      )

    case "camera":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cam-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4d8de" />
              <stop offset="50%" stopColor="#9aa0a8" />
              <stop offset="100%" stopColor="#656b73" />
            </linearGradient>
            <radialGradient id={`${uid}-cam-lens`} cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#4f99e8" />
              <stop offset="55%" stopColor="#1b2b4a" />
              <stop offset="100%" stopColor="#090d17" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-cam-bg)`} />
          <circle cx="32" cy="32" r="22" fill="#23262b" stroke="#eef1f5" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="15" fill={`url(#${uid}-cam-lens)`} stroke="#50565e" strokeWidth="1.5" />
          <circle cx="27" cy="27" r="4" fill="rgba(255,255,255,0.45)" />
        </svg>
      )

    case "music":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-mus-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffb338" />
              <stop offset="55%" stopColor="#f06816" />
              <stop offset="100%" stopColor="#b83400" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-mus-bg)`} />
          <path d="M26 42 V18 L46 14 V38" fill="none" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="21" cy="43" r="6" fill="#ffffff" />
          <circle cx="41" cy="39" r="6" fill="#ffffff" />
        </svg>
      )

    case "appstore":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-as-bg`} cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#4ec0ff" />
              <stop offset="65%" stopColor="#1b74d6" />
              <stop offset="100%" stopColor="#0f4188" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-as-bg)`} />
          <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
          <line x1="32" y1="15" x2="20" y2="45" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" />
          <line x1="32" y1="15" x2="44" y2="45" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" />
          <line x1="17" y1="37" x2="47" y2="37" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )

    case "settings":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-set-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9dde2" />
              <stop offset="50%" stopColor="#aeb4bc" />
              <stop offset="100%" stopColor="#777d85" />
            </linearGradient>
            <linearGradient id={`${uid}-set-gear`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#666c75" />
              <stop offset="100%" stopColor="#2e3238" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-set-bg)`} />
          <circle cx="32" cy="32" r="19" fill="none" stroke={`url(#${uid}-set-gear)`} strokeWidth="6" strokeDasharray="5 3.4" />
          <circle cx="32" cy="32" r="15" fill={`url(#${uid}-set-gear)`} stroke="#1d2024" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="8.5" fill="#c3c8cf" stroke="#363a40" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="4.2" fill="#464b52" />
        </svg>
      )

    case "idcard":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-id-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5c7fa6" />
              <stop offset="100%" stopColor="#355070" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-id-bg)`} />
          <rect x="27" y="4" width="10" height="8" rx="2" fill="#d0d6de" />
          <rect x="9" y="12" width="46" height="40" rx="4" fill="#f7f9fc" stroke="#1e2d40" strokeWidth="1.5" />
          <rect x="9" y="12" width="46" height="9" rx="3" fill="#2b6cb8" />
          <rect x="14" y="25" width="14" height="19" rx="2" fill="#d4e4f7" stroke="#99b6d9" strokeWidth="1" />
          <circle cx="21" cy="31.5" r="3.5" fill="#4a74a8" />
          <path d="M15.5 42 C15.5 38 18 36.5 21 36.5 C24 36.5 26.5 38 26.5 42 Z" fill="#4a74a8" />
          <path d="M33 28 H49 M33 34 H49 M33 40 H44" stroke="#62738a" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )

    case "contacts":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ct-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9c734b" />
              <stop offset="100%" stopColor="#5e3e22" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-ct-bg)`} />
          <rect x="52" y="8" width="12" height="12" fill="#4ea3e0" />
          <rect x="52" y="21" width="12" height="12" fill="#75c746" />
          <rect x="52" y="34" width="12" height="12" fill="#f0b135" />
          <rect x="52" y="47" width="12" height="12" fill="#de5747" />
          <rect x="51" y="0" width="2" height="64" fill="#3a2512" />
          <circle cx="27" cy="24" r="8" fill="#3c2613" opacity="0.72" />
          <path d="M13 48 C13 38 19 34 27 34 C35 34 41 38 41 48 Z" fill="#3c2613" opacity="0.72" />
        </svg>
      )

    case "power":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-pw-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3c434d" />
              <stop offset="100%" stopColor="#1b1f26" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-pw-bg)`} />
          <path
            d="M21 20 A16 16 0 1 0 43 20"
            fill="none"
            stroke="#7fe04c"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <line x1="32" y1="13" x2="32" y2="30" stroke="#7fe04c" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )

    case "folder":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <rect width="64" height="64" fill="#384454" />
          <rect x="10" y="10" width="19" height="19" rx="4" fill="#6ab5f7" />
          <rect x="35" y="10" width="19" height="19" rx="4" fill="#82db5c" />
          <rect x="10" y="35" width="19" height="19" rx="4" fill="#f7b249" />
          <rect x="35" y="35" width="19" height="19" rx="4" fill="#eb6054" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-def-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4c9bf0" />
              <stop offset="100%" stopColor="#1d529e" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${uid}-def-bg)`} />
          <rect x="16" y="16" width="32" height="32" rx="7" fill="rgba(255,255,255,0.22)" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="7" fill="#ffffff" />
        </svg>
      )
  }
}

export function Ios6AppIcon({
  kind,
  size = 58,
  badgeCount,
  badgeComponent: BadgeComponent,
  glossy = true,
  className,
  style,
}: Ios6IconProps): ReactNode {
  const radius = Math.round(size * 0.22)
  return (
    <div
      className={`relative inline-block shrink-0 select-none ${className ?? ""}`}
      style={{ width: size, height: size, ...style }}
    >
      <div
        className="relative size-full overflow-hidden"
        style={{
          borderRadius: radius,
          boxShadow:
            "0 4px 8px rgba(0, 0, 0, 0.48), 0 1px 2px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.55)",
        }}
      >
        <IconGlyphSvg kind={kind} size={size} />
        {glossy && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0"
            style={{
              height: "52%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.16) 76%, rgba(255,255,255,0.03) 100%)",
              borderBottomLeftRadius: "50% 24%",
              borderBottomRightRadius: "50% 24%",
            }}
          />
        )}
      </div>

      {BadgeComponent ? (
        <span className="pointer-events-none absolute -top-1.5 -right-1.5 z-10">
          <BadgeComponent />
        </span>
      ) : typeof badgeCount === "number" && badgeCount > 0 ? (
        <span
          className="ios6-badge pointer-events-none absolute -top-1.5 -right-1.5 flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] leading-[18px] font-bold text-white tabular-nums"
          aria-label={`${badgeCount}`}
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </div>
  )
}
