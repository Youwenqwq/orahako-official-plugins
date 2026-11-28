import type { ComponentType } from "react"
import type { Ios6StatusBarMode } from "./store"

export const IOS6_ICON_KINDS = [
  "calendar",
  "timetable",
  "overview",
  "grades",
  "trophy",
  "star",
  "clock",
  "reminders",
  "ibooks",
  "notes",
  "passbook",
  "wallet",
  "meter",
  "charge",
  "maps",
  "messages",
  "mail",
  "safari",
  "compass",
  "weather",
  "camera",
  "music",
  "appstore",
  "settings",
  "idcard",
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
  readonly title?: string
  readonly icon?: string
  readonly group?: string
}): Ios6IconKind {
  const key = `${hint.pluginId ?? ""} ${hint.id ?? ""} ${hint.title ?? ""} ${hint.icon ?? ""}`.toLowerCase()

  if (key.includes("overview") || key.includes("总览") || key.includes("layout-dashboard")) {
    return "overview"
  }
  // Distinguish "school-schedule" (全校课表) from personal "schedule" (课程表)
  if (
    key.includes("school-schedule") ||
    key.includes("school_schedule") ||
    key.includes("全校课表") ||
    key.includes("校历")
  ) {
    return "timetable"
  }
  if (key.includes("schedule") || key.includes("课表") || key.includes("calendar")) {
    return "calendar"
  }
  // Distinguish "makeup-exams" (补考) from regular "exams" (考试)
  if (
    key.includes("makeup") ||
    key.includes("补考") ||
    key.includes("缓考") ||
    key.includes("reminder") ||
    key.includes("待办")
  ) {
    return "reminders"
  }
  if (key.includes("exam") || key.includes("考试") || key.includes("clock") || key.includes("倒计时")) {
    return "clock"
  }
  // Distinguish "comprehensive" (综合测评) and "credits" (双创学分) from "grades" (成绩)
  if (key.includes("comprehensive") || key.includes("综测") || key.includes("综合测评")) {
    return "trophy"
  }
  if (key.includes("credit") || key.includes("双创") || key.includes("学分")) {
    return "star"
  }
  if (key.includes("grade") || key.includes("成绩") || key.includes("gpa")) {
    return "grades"
  }
  // Distinguish "training-plan" (培养方案) from "labor" (劳动教育)
  if (
    key.includes("training-plan") ||
    key.includes("training_plan") ||
    key.includes("培养方案") ||
    key.includes("book")
  ) {
    return "ibooks"
  }
  if (key.includes("labor") || key.includes("劳动") || key.includes("note") || key.includes("备忘")) {
    return "notes"
  }
  // Distinguish "campus-charge" (校园充电), "meter" (空调电费), "epay" (缴费), "ecard" (一卡通)
  if (key.includes("campus-charge") || key.includes("充电") || key.includes("battery")) {
    return "charge"
  }
  if (key.includes("meter") || key.includes("电费") || key.includes("水电") || key.includes("空调")) {
    return "meter"
  }
  if (key.includes("epay") || key.includes("缴费") || key.includes("支付") || key.includes("pay")) {
    return "wallet"
  }
  if (
    key.includes("ecard") ||
    key.includes("一卡通") ||
    key.includes("校园卡") ||
    key.includes("passbook")
  ) {
    return "passbook"
  }
  if (
    key.includes("free-room") ||
    key.includes("room") ||
    key.includes("building") ||
    key.includes("空教室") ||
    key.includes("map")
  ) {
    return "maps"
  }
  if (
    key.includes("notification") ||
    key.includes("announcement") ||
    key.includes("通知") ||
    key.includes("公告") ||
    key.includes("message") ||
    key.includes("bell")
  ) {
    return "messages"
  }
  if (key.includes("evaluation") || key.includes("评教") || key.includes("评价") || key.includes("mail")) {
    return "mail"
  }
  if (key.includes("skbird") || key.includes("森空") || key.includes("compass") || key.includes("指南针")) {
    return "compass"
  }
  if (key.includes("weather") || key.includes("天气")) {
    return "weather"
  }
  if (key.includes("camera") || key.includes("相机") || key.includes("扫码") || key.includes("scan")) {
    return "camera"
  }
  if (key.includes("music") || key.includes("音乐")) {
    return "music"
  }
  if (
    key.includes("plugin") ||
    key.includes("插件") ||
    key.includes("puzzle") ||
    key.includes("package") ||
    key.includes("store")
  ) {
    return "appstore"
  }
  if (key.includes("setting") || key.includes("设置") || key.includes("cog") || key.includes("sliders")) {
    return "settings"
  }
  // Distinguish "student-info" (学生信息) from "profile" (我的)
  if (key.includes("student-info") || key.includes("student_info") || key.includes("学生信息") || key.includes("学籍")) {
    return "idcard"
  }
  if (
    key.includes("profile") ||
    key.includes("我的") ||
    key.includes("个人") ||
    key.includes("user") ||
    key.includes("auth") ||
    key.includes("contact")
  ) {
    return "contacts"
  }
  if (key.includes("browser") || key.includes("safari") || key.includes("web")) {
    return "safari"
  }
  if (hint.group === "fees") return "wallet"
  if (hint.group === "account") return "contacts"
  if (hint.group === "plugins") return "appstore"
  if (hint.group === "academic") return "ibooks"
  return "default"
}

export function resolveEffectiveShowStatusBar(params: {
  readonly statusBarMode: Ios6StatusBarMode | undefined
  readonly legacyShowStatusBar?: boolean
  readonly hasNativeSafeAreaTop: boolean
  readonly isIphoneFrame: boolean
}): boolean {
  const mode: Ios6StatusBarMode =
    params.statusBarMode ?? (params.legacyShowStatusBar === false ? "off" : "auto")
  if (mode === "off") return false
  if (mode === "always") return true
  if (params.isIphoneFrame) return true
  return !params.hasNativeSafeAreaTop
}

export function computeSpringboardSwipe(params: {
  readonly deltaX: number
  readonly currentPage: number
  readonly totalPages: number
  readonly containerWidth: number
  readonly velocityPxPerMs?: number
}): {
  readonly visualOffsetPx: number
  readonly nextPage: number
  readonly openSpotlight: boolean
} {
  const { deltaX, currentPage, totalPages, containerWidth, velocityPxPerMs = 0 } = params
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(0, currentPage), safeTotal - 1)
  const safeWidth = Math.max(240, containerWidth)

  if (safePage === 0 && deltaX > 0) {
    const spotlightThreshold = Math.min(92, Math.max(56, safeWidth * 0.24))
    return {
      visualOffsetPx: deltaX * 0.35,
      nextPage: 0,
      openSpotlight: deltaX >= spotlightThreshold,
    }
  }

  if (safePage === safeTotal - 1 && deltaX < 0) {
    return {
      visualOffsetPx: deltaX * 0.28,
      nextPage: safePage,
      openSpotlight: false,
    }
  }

  const distanceThreshold = Math.min(80, Math.max(42, safeWidth * 0.18))
  const isFlick = Math.abs(velocityPxPerMs) >= 0.32 && Math.abs(deltaX) >= 24

  let nextPage = safePage
  if (deltaX <= -distanceThreshold || (deltaX < 0 && isFlick)) {
    nextPage = Math.min(safeTotal - 1, safePage + 1)
  } else if (deltaX >= distanceThreshold || (deltaX > 0 && isFlick)) {
    nextPage = Math.max(0, safePage - 1)
  }

  return {
    visualOffsetPx: deltaX,
    nextPage,
    openSpotlight: false,
  }
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
    // Ignore storage errors
  }
}
