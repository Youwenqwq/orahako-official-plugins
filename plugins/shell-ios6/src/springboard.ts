import type { ComponentType } from "react"

export const IOS6_ICON_KINDS = [
  "calendar",
  "overview",
  "grades",
  "notes",
  "passbook",
  "maps",
  "messages",
  "mail",
  "safari",
  "appstore",
  "settings",
  "contacts",
  "power",
  "folder",
  "default",
] as const

export type Ios6IconKind = (typeof IOS6_ICON_KINDS)[number]

export interface SpringBoardAppEntry {
  readonly key: string
  readonly kind: "plugin-page" | "builtin-settings" | "builtin-default-shell" | "folder"
  readonly pluginId?: string
  readonly pageId?: string
  readonly routeParams?: Readonly<Record<string, string>>
  readonly title: string
  readonly group: string
  readonly groupLabel: string
  readonly icon: Ios6IconKind
  readonly primary: boolean
  readonly badgeCount?: number
  readonly badgeComponent?: ComponentType
  readonly children?: readonly SpringBoardAppEntry[]
}

export interface SpringBoardSettingsEntry {
  readonly id: string
  readonly categoryId?: string
  readonly pluginId?: string
  readonly title: string
  readonly description?: string
  readonly icon: Ios6IconKind
  readonly kind: "system-settings" | "category"
}

export interface ViewportSize {
  readonly width: number
  readonly height: number
}

export interface SpringBoardGridConfig {
  readonly columns: number
  readonly rows: number
  readonly pageSize: number
  readonly isCompact: boolean
}

export function resolveIos6IconKind(hint: {
  readonly pluginId?: string
  readonly id?: string
  readonly icon?: string
  readonly group?: string
}): Ios6IconKind {
  const key = `${hint.pluginId ?? ""} ${hint.id ?? ""} ${hint.icon ?? ""}`.toLowerCase()

  if (key.includes("overview") || key.includes("home") || key.includes("layout-dashboard")) {
    return "overview"
  }
  if (key.includes("schedule") || key.includes("timetable") || key.includes("calendar")) {
    return "calendar"
  }
  if (
    key.includes("grade") ||
    key.includes("credit") ||
    key.includes("comprehensive") ||
    key.includes("award") ||
    key.includes("trophy")
  ) {
    return "grades"
  }
  if (
    key.includes("exam") ||
    key.includes("training-plan") ||
    key.includes("labor") ||
    key.includes("note") ||
    key.includes("clock")
  ) {
    return "notes"
  }
  if (
    key.includes("ecard") ||
    key.includes("epay") ||
    key.includes("meter") ||
    key.includes("wallet") ||
    key.includes("fee") ||
    key.includes("charge")
  ) {
    return "passbook"
  }
  if (key.includes("room") || key.includes("building") || key.includes("map")) {
    return "maps"
  }
  if (
    key.includes("notification") ||
    key.includes("announcement") ||
    key.includes("skbird") ||
    key.includes("message") ||
    key.includes("bell")
  ) {
    return "messages"
  }
  if (key.includes("evaluation") || key.includes("mail")) {
    return "mail"
  }
  if (key.includes("plugin") || key.includes("puzzle") || key.includes("package") || key.includes("store")) {
    return "appstore"
  }
  if (key.includes("setting") || key.includes("cog") || key.includes("sliders") || key.includes("display")) {
    return "settings"
  }
  if (
    key.includes("profile") ||
    key.includes("student") ||
    key.includes("user") ||
    key.includes("auth") ||
    key.includes("contact")
  ) {
    return "contacts"
  }
  if (key.includes("browser") || key.includes("safari") || key.includes("web")) {
    return "safari"
  }
  if (hint.group === "fees") return "passbook"
  if (hint.group === "account") return "contacts"
  if (hint.group === "plugins") return "appstore"
  return "default"
}

export function resolveGridConfig(
  viewport: ViewportSize,
  desktopMode: "ipad" | "iphone"
): SpringBoardGridConfig {
  const isCompact = viewport.width < 768 || desktopMode === "iphone"
  if (isCompact) {
    const height = desktopMode === "iphone" && viewport.width >= 768 ? 640 : viewport.height
    const rows = height >= 760 ? 4 : 3
    return {
      columns: 4,
      rows,
      pageSize: 4 * rows,
      isCompact: true,
    }
  }
  const columns = viewport.width >= 1060 ? 6 : 5
  const rows = viewport.height >= 720 ? 3 : 2
  return {
    columns,
    rows,
    pageSize: columns * rows,
    isCompact: false,
  }
}

export interface PartitionedSpringBoard {
  readonly dockApps: readonly SpringBoardAppEntry[]
  readonly pages: readonly (readonly SpringBoardAppEntry[])[]
  readonly allSearchableApps: readonly SpringBoardAppEntry[]
}

export function partitionSpringBoardApps(
  pluginApps: readonly SpringBoardAppEntry[],
  builtins: {
    readonly settingsApp: SpringBoardAppEntry
    readonly defaultShellApp: SpringBoardAppEntry
  },
  pageSize: number,
  options?: {
    readonly maxDockItems?: number
    readonly showBadges?: boolean
  }
): PartitionedSpringBoard {
  const maxDock = options?.maxDockItems ?? 4
  const showBadges = options?.showBadges ?? true

  const decoratedPluginApps = pluginApps.map((app) => {
    if (!showBadges) {
      return { ...app, badgeCount: undefined, badgeComponent: undefined }
    }
    return app
  })

  // Select up to (maxDock - 1) featured plugin apps for the Dock, keeping Settings always on Dock right
  const dockCandidates: SpringBoardAppEntry[] = []
  const usedInDock = new Set<string>()

  const pickDockCandidate = (predicate: (app: SpringBoardAppEntry) => boolean) => {
    if (dockCandidates.length >= Math.max(0, maxDock - 1)) return
    const found = decoratedPluginApps.find(
      (app) => !usedInDock.has(app.key) && predicate(app)
    )
    if (found) {
      usedInDock.add(found.key)
      dockCandidates.push(found)
    }
  }

  pickDockCandidate((app) => app.icon === "overview")
  pickDockCandidate((app) => app.icon === "calendar")
  pickDockCandidate((app) => app.icon === "grades")
  pickDockCandidate((app) => app.icon === "appstore")
  pickDockCandidate((app) => app.primary)
  pickDockCandidate(() => true)

  const dockApps: SpringBoardAppEntry[] = [...dockCandidates, builtins.settingsApp].slice(0, maxDock)
  const dockKeys = new Set(dockApps.map((app) => app.key))

  // Remaining plugin apps + Default Shell switcher go onto the SpringBoard pages
  const gridApps: SpringBoardAppEntry[] = [
    ...decoratedPluginApps.filter((app) => !dockKeys.has(app.key)),
    builtins.defaultShellApp,
  ]

  const safePageSize = Math.max(4, pageSize)
  const pages: SpringBoardAppEntry[][] = []
  for (let i = 0; i < gridApps.length; i += safePageSize) {
    pages.push(gridApps.slice(i, i + safePageSize))
  }
  if (pages.length === 0) {
    pages.push([builtins.defaultShellApp])
  }

  // Deduplicated flat list for Spotlight Search
  const seenSearch = new Set<string>()
  const allSearchableApps: SpringBoardAppEntry[] = []
  for (const app of [...dockApps, ...gridApps]) {
    if (seenSearch.has(app.key)) continue
    seenSearch.add(app.key)
    allSearchableApps.push(app)
  }

  return {
    dockApps,
    pages,
    allSearchableApps,
  }
}

export interface SpotlightSearchResult {
  readonly apps: readonly SpringBoardAppEntry[]
  readonly settings: readonly SpringBoardSettingsEntry[]
}

export function filterSpotlightResults(
  apps: readonly SpringBoardAppEntry[],
  settings: readonly SpringBoardSettingsEntry[],
  query: string
): SpotlightSearchResult {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return {
      apps: apps.slice(0, 8),
      settings: settings.slice(0, 4),
    }
  }
  const matchedApps = apps.filter((app) => {
    const haystack = `${app.title} ${app.groupLabel} ${app.pluginId ?? ""} ${app.icon}`.toLowerCase()
    return haystack.includes(normalized)
  })
  const matchedSettings = settings.filter((item) => {
    const haystack = `${item.title} ${item.description ?? ""} ${item.pluginId ?? ""} ${item.categoryId ?? ""}`.toLowerCase()
    return haystack.includes(normalized)
  })
  return {
    apps: matchedApps,
    settings: matchedSettings,
  }
}

export function computeSlideUnlockProgress(
  deltaX: number,
  trackWidth: number,
  knobWidth: number
): {
  readonly offsetPx: number
  readonly progress: number
  readonly unlocked: boolean
} {
  const maxTravel = Math.max(1, trackWidth - knobWidth - 8)
  const offsetPx = Math.min(Math.max(0, deltaX), maxTravel)
  const progress = offsetPx / maxTravel
  return {
    offsetPx,
    progress,
    unlocked: progress >= 0.72,
  }
}

export const SESSION_UNLOCK_KEY = "orahako-shell-ios6:unlocked"

export function readSessionUnlocked(storage?: Pick<Storage, "getItem"> | null): boolean {
  try {
    const target = storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : null)
    return target?.getItem(SESSION_UNLOCK_KEY) === "1"
  } catch {
    return false
  }
}

export function writeSessionUnlocked(
  unlocked: boolean,
  storage?: Pick<Storage, "setItem" | "removeItem"> | null
): void {
  try {
    const target = storage ?? (typeof sessionStorage !== "undefined" ? sessionStorage : null)
    if (!target) return
    if (unlocked) {
      target.setItem(SESSION_UNLOCK_KEY, "1")
    } else {
      target.removeItem(SESSION_UNLOCK_KEY)
    }
  } catch {
    // Ignore restricted storage environments
  }
}
