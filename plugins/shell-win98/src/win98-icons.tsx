import { createContext, useContext, type CSSProperties, type ReactNode } from "react"

export const WIN98_ICON_KINDS = [
  "start",
  "computer",
  "folder",
  "folder-open",
  "schedule",
  "grades",
  "exams",
  "settings",
  "plugins",
  "profile",
  "wallet",
  "building",
  "document",
  "display",
  "about",
  "desktop",
  "shutdown",
  "home",
  "network-idle",
  "network-active",
] as const

export type Win98IconKind = (typeof WIN98_ICON_KINDS)[number]

export type Win98IconUrlMap = Readonly<Partial<Record<Win98IconKind, string>>>

const Win98IconAssetsContext = createContext<Win98IconUrlMap>({})

export function Win98IconAssetsProvider({
  urls,
  children,
}: {
  readonly urls: Win98IconUrlMap
  readonly children: ReactNode
}): ReactNode {
  return <Win98IconAssetsContext.Provider value={urls}>{children}</Win98IconAssetsContext.Provider>
}

interface IconProps {
  readonly kind: Win98IconKind
  readonly size?: number
  readonly className?: string
  readonly style?: CSSProperties
}

export function resolveWin98IconKind(hint: {
  readonly pluginId?: string
  readonly id?: string
  readonly icon?: string
  readonly group?: string
}): Win98IconKind {
  const key = `${hint.pluginId ?? ""} ${hint.id ?? ""} ${hint.icon ?? ""}`.toLowerCase()
  if (key.includes("overview") || key.includes("home") || key.includes("layout-dashboard")) {
    return "home"
  }
  if (key.includes("schedule") || key.includes("calendar") || key.includes("timetable")) {
    return "schedule"
  }
  if (key.includes("grade") || key.includes("credit") || key.includes("comprehensive") || key.includes("award") || key.includes("trophy")) {
    return "grades"
  }
  if (key.includes("exam") || key.includes("clock") || key.includes("alarm")) {
    return "exams"
  }
  if (key.includes("setting") || key.includes("cog") || key.includes("sliders")) {
    return "settings"
  }
  if (key.includes("plugin") || key.includes("puzzle") || key.includes("package") || key.includes("store")) {
    return "plugins"
  }
  if (key.includes("profile") || key.includes("student") || key.includes("user") || key.includes("auth")) {
    return "profile"
  }
  if (key.includes("ecard") || key.includes("epay") || key.includes("meter") || key.includes("wallet") || key.includes("fee") || key.includes("zap")) {
    return "wallet"
  }
  if (key.includes("room") || key.includes("building") || key.includes("door")) {
    return "building"
  }
  if (hint.group === "fees") return "wallet"
  if (hint.group === "account") return "profile"
  if (hint.group === "plugins") return "plugins"
  return "document"
}

export function Win98Icon({ kind, size = 16, className, style }: IconProps): ReactNode {
  const iconUrls = useContext(Win98IconAssetsContext)
  const assetUrl = iconUrls[kind]
  if (assetUrl) {
    return (
      <img
        src={assetUrl}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={className}
        style={{
          display: "inline-block",
          flexShrink: 0,
          width: size,
          height: size,
          objectFit: "contain",
          imageRendering: "pixelated",
          ...style,
        }}
        aria-hidden="true"
      />
    )
  }

  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    shapeRendering: "crispEdges" as const,
    className,
    style: { display: "inline-block", flexShrink: 0, ...style },
    "aria-hidden": true as const,
  }

  switch (kind) {
    case "start":
      return (
        <svg {...svgProps}>
          {/* Classic 4-pane flying window flag */}
          <rect x="2" y="3" width="2" height="1" fill="#000" />
          <rect x="1" y="5" width="2" height="1" fill="#000" />
          <rect x="2" y="7" width="2" height="1" fill="#000" />
          <rect x="1" y="9" width="2" height="1" fill="#000" />
          <rect x="2" y="11" width="2" height="1" fill="#000" />
          <rect x="5" y="2" width="4" height="5" fill="#e53935" />
          <rect x="10" y="3" width="4" height="5" fill="#43a047" />
          <rect x="5" y="8" width="4" height="5" fill="#1e88e5" />
          <rect x="10" y="9" width="4" height="5" fill="#fdd835" />
          <rect x="5" y="2" width="4" height="1" fill="#ff8a80" />
          <rect x="10" y="3" width="4" height="1" fill="#a5d6a7" />
        </svg>
      )

    case "computer":
      return (
        <svg {...svgProps}>
          <rect x="2" y="1" width="12" height="9" fill="#808080" />
          <rect x="2" y="1" width="11" height="8" fill="#dfdfdf" />
          <rect x="3" y="2" width="9" height="6" fill="#008080" />
          <rect x="4" y="3" width="3" height="2" fill="#00ffff" />
          <rect x="5" y="10" width="6" height="2" fill="#808080" />
          <rect x="1" y="12" width="14" height="3" fill="#000" />
          <rect x="1" y="12" width="13" height="2" fill="#c0c0c0" />
          <rect x="2" y="12" width="11" height="1" fill="#ffffff" />
          <rect x="10" y="13" width="2" height="1" fill="#00c853" />
        </svg>
      )

    case "folder":
      return (
        <svg {...svgProps}>
          <rect x="1" y="3" width="5" height="2" fill="#808000" />
          <rect x="2" y="4" width="4" height="1" fill="#ffff80" />
          <rect x="1" y="5" width="14" height="9" fill="#000" />
          <rect x="1" y="5" width="13" height="8" fill="#e8c840" />
          <rect x="2" y="6" width="11" height="1" fill="#ffffa0" />
          <rect x="2" y="12" width="12" height="1" fill="#a88800" />
        </svg>
      )

    case "folder-open":
      return (
        <svg {...svgProps}>
          <rect x="1" y="3" width="5" height="2" fill="#808000" />
          <rect x="1" y="5" width="12" height="8" fill="#a88800" />
          <rect x="2" y="6" width="10" height="6" fill="#ffffa0" />
          <rect x="3" y="7" width="12" height="6" fill="#000" />
          <rect x="3" y="7" width="11" height="5" fill="#e8c840" />
          <rect x="4" y="8" width="9" height="1" fill="#ffffc0" />
        </svg>
      )

    case "home":
      return (
        <svg {...svgProps}>
          <polygon points="8,1 1,7 15,7" fill="#c62828" />
          <rect x="3" y="7" width="10" height="8" fill="#000" />
          <rect x="3" y="7" width="9" height="7" fill="#fff8dc" />
          <rect x="6" y="10" width="3" height="4" fill="#8d5524" />
          <rect x="4" y="8" width="2" height="2" fill="#1e88e5" />
          <rect x="10" y="8" width="2" height="2" fill="#1e88e5" />
        </svg>
      )

    case "schedule":
      return (
        <svg {...svgProps}>
          <rect x="2" y="2" width="12" height="13" fill="#000" />
          <rect x="2" y="2" width="11" height="12" fill="#ffffff" />
          <rect x="2" y="2" width="11" height="3" fill="#c62828" />
          <rect x="4" y="1" width="2" height="2" fill="#808080" />
          <rect x="10" y="1" width="2" height="2" fill="#808080" />
          <rect x="4" y="7" width="2" height="2" fill="#000080" />
          <rect x="7" y="7" width="2" height="2" fill="#008080" />
          <rect x="10" y="7" width="2" height="2" fill="#808080" />
          <rect x="4" y="10" width="2" height="2" fill="#808080" />
          <rect x="7" y="10" width="2" height="2" fill="#c62828" />
          <rect x="10" y="10" width="2" height="2" fill="#000080" />
        </svg>
      )

    case "grades":
      return (
        <svg {...svgProps}>
          <rect x="4" y="2" width="8" height="6" fill="#000" />
          <rect x="4" y="2" width="7" height="5" fill="#ffd700" />
          <rect x="5" y="3" width="2" height="3" fill="#ffffa0" />
          <rect x="2" y="3" width="2" height="3" fill="#daa520" />
          <rect x="12" y="3" width="2" height="3" fill="#daa520" />
          <rect x="6" y="8" width="4" height="3" fill="#daa520" />
          <rect x="4" y="11" width="8" height="3" fill="#000" />
          <rect x="4" y="11" width="7" height="2" fill="#8b4513" />
        </svg>
      )

    case "exams":
      return (
        <svg {...svgProps}>
          <rect x="3" y="2" width="10" height="12" fill="#000" />
          <rect x="3" y="2" width="9" height="11" fill="#ffffff" />
          <rect x="4" y="3" width="7" height="9" fill="#f0f4ff" />
          <rect x="7" y="4" width="1" height="4" fill="#000080" />
          <rect x="7" y="7" width="3" height="1" fill="#c62828" />
          <rect x="6" y="1" width="4" height="1" fill="#808080" />
        </svg>
      )

    case "settings":
      return (
        <svg {...svgProps}>
          <rect x="2" y="2" width="12" height="12" fill="#000" />
          <rect x="2" y="2" width="11" height="11" fill="#c0c0c0" />
          <rect x="3" y="3" width="9" height="1" fill="#ffffff" />
          <rect x="4" y="5" width="7" height="2" fill="#808080" />
          <rect x="8" y="4" width="2" height="4" fill="#000080" />
          <rect x="4" y="9" width="7" height="2" fill="#808080" />
          <rect x="5" y="8" width="2" height="4" fill="#008080" />
        </svg>
      )

    case "plugins":
      return (
        <svg {...svgProps}>
          <rect x="2" y="2" width="12" height="12" fill="#000" />
          <rect x="2" y="2" width="11" height="11" fill="#1e88e5" />
          <rect x="4" y="2" width="7" height="5" fill="#ffffff" />
          <rect x="5" y="3" width="5" height="1" fill="#808080" />
          <rect x="5" y="5" width="4" height="1" fill="#808080" />
          <rect x="4" y="9" width="7" height="4" fill="#c0c0c0" />
          <rect x="8" y="10" width="2" height="2" fill="#000080" />
        </svg>
      )

    case "profile":
      return (
        <svg {...svgProps}>
          <rect x="1" y="3" width="14" height="10" fill="#000" />
          <rect x="1" y="3" width="13" height="9" fill="#ffffff" />
          <rect x="2" y="4" width="11" height="2" fill="#000080" />
          <rect x="3" y="7" width="3" height="3" fill="#008080" />
          <rect x="7" y="7" width="5" height="1" fill="#808080" />
          <rect x="7" y="9" width="4" height="1" fill="#808080" />
        </svg>
      )

    case "wallet":
      return (
        <svg {...svgProps}>
          <rect x="1" y="4" width="14" height="9" fill="#000" />
          <rect x="1" y="4" width="13" height="8" fill="#2e7d32" />
          <rect x="2" y="5" width="11" height="2" fill="#66bb6a" />
          <rect x="3" y="8" width="3" height="2" fill="#ffd700" />
          <rect x="8" y="9" width="4" height="1" fill="#ffffff" />
        </svg>
      )

    case "building":
      return (
        <svg {...svgProps}>
          <rect x="3" y="2" width="10" height="13" fill="#000" />
          <rect x="3" y="2" width="9" height="12" fill="#c0c0c0" />
          <rect x="4" y="3" width="2" height="2" fill="#008080" />
          <rect x="8" y="3" width="2" height="2" fill="#008080" />
          <rect x="4" y="6" width="2" height="2" fill="#008080" />
          <rect x="8" y="6" width="2" height="2" fill="#008080" />
          <rect x="6" y="10" width="3" height="4" fill="#804000" />
        </svg>
      )

    case "display":
      return (
        <svg {...svgProps}>
          <rect x="2" y="1" width="12" height="10" fill="#000" />
          <rect x="2" y="1" width="11" height="9" fill="#c0c0c0" />
          <rect x="3" y="2" width="9" height="7" fill="#008080" />
          <rect x="4" y="3" width="4" height="3" fill="#ffeb3b" />
          <rect x="7" y="5" width="4" height="3" fill="#e91e63" />
          <rect x="5" y="11" width="6" height="2" fill="#808080" />
          <rect x="3" y="13" width="10" height="2" fill="#c0c0c0" />
        </svg>
      )

    case "about":
      return (
        <svg {...svgProps}>
          <rect x="4" y="2" width="8" height="12" fill="#000080" />
          <rect x="2" y="4" width="12" height="8" fill="#000080" />
          <rect x="4" y="3" width="8" height="10" fill="#1e88e5" />
          <rect x="3" y="4" width="10" height="8" fill="#1e88e5" />
          <rect x="7" y="4" width="2" height="2" fill="#ffffff" />
          <rect x="7" y="7" width="2" height="5" fill="#ffffff" />
        </svg>
      )

    case "desktop":
      return (
        <svg {...svgProps}>
          <rect x="1" y="2" width="14" height="11" fill="#000" />
          <rect x="2" y="3" width="12" height="9" fill="#008080" />
          <rect x="2" y="10" width="12" height="2" fill="#c0c0c0" />
          <rect x="3" y="4" width="2" height="2" fill="#ffff80" />
          <rect x="3" y="7" width="2" height="2" fill="#ffffff" />
          <rect x="9" y="5" width="4" height="4" fill="#ffffff" />
          <rect x="9" y="5" width="4" height="1" fill="#000080" />
        </svg>
      )

    case "shutdown":
      return (
        <svg {...svgProps}>
          <rect x="3" y="3" width="10" height="10" fill="#000" />
          <rect x="3" y="3" width="9" height="9" fill="#c62828" />
          <rect x="7" y="4" width="2" height="4" fill="#ffffff" />
          <rect x="5" y="6" width="1" height="4" fill="#ffffff" />
          <rect x="10" y="6" width="1" height="4" fill="#ffffff" />
          <rect x="5" y="10" width="6" height="1" fill="#ffffff" />
        </svg>
      )

    case "network-idle":
    case "network-active": {
      const screenFill = kind === "network-active" ? "#00e5ff" : "#005a5a"
      const ledFill = kind === "network-active" ? "#00ff41" : "#808080"
      return (
        <svg {...svgProps}>
          {/* Back monitor */}
          <rect x="6" y="1" width="9" height="7" fill="#000" />
          <rect x="6" y="1" width="8" height="6" fill="#c0c0c0" />
          <rect x="7" y="2" width="6" height="4" fill={screenFill} />
          <rect x="9" y="8" width="3" height="1" fill="#808080" />
          {/* Front monitor */}
          <rect x="1" y="6" width="9" height="7" fill="#000" />
          <rect x="1" y="6" width="8" height="6" fill="#dfdfdf" />
          <rect x="2" y="7" width="6" height="4" fill={screenFill} />
          <rect x="3" y="13" width="4" height="2" fill="#808080" />
          {/* Activity LED */}
          <rect x="7" y="11" width="1" height="1" fill={ledFill} />
        </svg>
      )
    }

    case "document":
    default:
      return (
        <svg {...svgProps}>
          <rect x="3" y="1" width="9" height="14" fill="#000" />
          <rect x="3" y="1" width="8" height="13" fill="#ffffff" />
          <rect x="9" y="1" width="3" height="3" fill="#c0c0c0" />
          <rect x="5" y="5" width="5" height="1" fill="#000080" />
          <rect x="5" y="7" width="5" height="1" fill="#808080" />
          <rect x="5" y="9" width="5" height="1" fill="#808080" />
          <rect x="5" y="11" width="3" height="1" fill="#808080" />
        </svg>
      )
  }
}

export function Win98CaptionGlyph({
  kind,
}: {
  readonly kind: "min" | "max" | "restore" | "close"
}): ReactNode {
  switch (kind) {
    case "min":
      return (
        <svg width="9" height="9" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="1" y="6" width="6" height="2" fill="currentColor" />
        </svg>
      )
    case "max":
      return (
        <svg width="9" height="9" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="0" y="0" width="9" height="2" fill="currentColor" />
          <rect x="0" y="2" width="1" height="6" fill="currentColor" />
          <rect x="8" y="2" width="1" height="6" fill="currentColor" />
          <rect x="0" y="8" width="9" height="1" fill="currentColor" />
        </svg>
      )
    case "restore":
      return (
        <svg width="9" height="9" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
          <rect x="2" y="0" width="7" height="2" fill="currentColor" />
          <rect x="8" y="2" width="1" height="4" fill="currentColor" />
          <rect x="6" y="5" width="2" height="1" fill="currentColor" />
          <rect x="0" y="3" width="6" height="2" fill="currentColor" />
          <rect x="0" y="5" width="1" height="3" fill="currentColor" />
          <rect x="5" y="5" width="1" height="3" fill="currentColor" />
          <rect x="0" y="8" width="6" height="1" fill="currentColor" />
        </svg>
      )
    case "close":
      return (
        <svg width="9" height="9" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
          <path
            d="M1 1h2v1h1v1h1V2h1V1h2v1H7v1H6v1h1v1h1v1H6V5H5V4H4v1H3v1H1V5h1V4h1V3H2V2H1V1z"
            fill="currentColor"
          />
        </svg>
      )
  }
}
