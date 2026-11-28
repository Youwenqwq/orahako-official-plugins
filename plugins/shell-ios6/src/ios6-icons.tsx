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
          {/* Subtle iOS 6 Stocks pinstripe grid */}
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
          {/* LCD screen */}
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
          {/* Skeuomorphic buttons */}
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
          {/* Leather stitching */}
          <line x1="4" y1="14.5" x2="60" y2="14.5" stroke="#c89a6f" strokeWidth="1" strokeDasharray="3 2" />
          {/* Torn paper shadow */}
          <rect y="18" width="64" height="2" fill="rgba(0,0,0,0.22)" />
          {/* Red margin rule */}
          <line x1="14" y1="18" x2="14" y2="64" stroke="#d95b5b" strokeWidth="1.2" opacity="0.65" />
          {/* Ruled notepad lines */}
          {[28, 36, 44, 52, 60].map((y) => (
            <line key={y} x1="0" y1={y} x2="64" y2={y} stroke="#c2b35e" strokeWidth="1" />
          ))}
          {/* Handwritten-style check & text */}
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
          {/* Pocket leather bottom */}
          <path d="M0 44 L23 44 C26 44 27 48 32 48 C37 48 38 44 41 44 L64 44 L64 64 L0 64 Z" fill="#23252a" />
          <path d="M0 44 L23 44 C26 44 27 48 32 48 C37 48 38 44 41 44 L64 44" fill="none" stroke="#62666e" strokeWidth="1.2" />
          <circle cx="18" cy="17" r="2.2" fill="rgba(255,255,255,0.85)" />
          <rect x="24" y="15.5" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.75)" />
          <rect x="15" y="27" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.85)" />
          <rect x="15" y="38" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.9)" />
        </svg>
      )

    case "maps":
      return (
        <svg viewBox="0 0 64 64" width={size} height={size} className="block size-full" aria-hidden="true">
          <rect width="64" height="64" fill="#efe6cf" />
          {/* Park & water */}
          <path d="M0 0 L28 0 L20 26 L0 22 Z" fill="#b6d99a" />
          <path d="M40 38 C48 34 56 42 64 36 L64 64 L36 64 Z" fill="#82bdf0" />
          {/* Roads */}
          <path d="M0 32 L64 22" stroke="#ffffff" strokeWidth="7" />
          <path d="M0 32 L64 22" stroke="#f5c342" strokeWidth="3.5" />
          <path d="M26 0 L34 64" stroke="#ffffff" strokeWidth="6" />
          <path d="M26 0 L34 64" stroke="#d8d0bc" strokeWidth="1" />
          {/* Red iOS 6 map pin */}
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
          {/* Compass ticks */}
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
          {/* Diagonal needle */}
          <polygon points="32,27 46,16 37,32" fill="#ea3326" />
          <polygon points="32,27 18,48 37,32" fill="#ffffff" />
          <circle cx="32" cy="32" r="2.5" fill="#d8dde4" />
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
          {/* Iconic iOS 6 App Store "A" */}
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
          {/* Outer mechanical gear ring */}
          <circle cx="32" cy="32" r="19" fill="none" stroke={`url(#${uid}-set-gear)`} strokeWidth="6" strokeDasharray="5 3.4" />
          <circle cx="32" cy="32" r="15" fill={`url(#${uid}-set-gear)`} stroke="#1d2024" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="8.5" fill="#c3c8cf" stroke="#363a40" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="4.2" fill="#464b52" />
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
          {/* Index tabs on right */}
          <rect x="52" y="8" width="12" height="12" fill="#4ea3e0" />
          <rect x="52" y="21" width="12" height="12" fill="#75c746" />
          <rect x="52" y="34" width="12" height="12" fill="#f0b135" />
          <rect x="52" y="47" width="12" height="12" fill="#de5747" />
          <rect x="51" y="0" width="2" height="64" fill="#3a2512" />
          {/* Embossed person silhouette */}
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
          {/* Glowing Orahako exit / restore modern shell glyph */}
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
