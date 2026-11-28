import { describe, expect, it } from "vitest"
import { validatePluginManifest } from "@orahako/sdk"
import manifest from "../manifest.json"
import { IOS6_GLOBAL_CSS } from "./ios6-styles"
import {
  computeSlideUnlockProgress,
  computeSpringboardSwipe,
  filterSpotlightResults,
  partitionSpringBoardApps,
  readSessionUnlocked,
  resolveEffectiveShowStatusBar,
  resolveGridConfig,
  resolveIos6IconKind,
  SESSION_UNLOCK_KEY,
  writeSessionUnlocked,
  type SpringBoardAppEntry,
  type SpringBoardSettingsEntry,
} from "./springboard"
import { createDefaultIos6State, migrateIos6StoreState } from "./store"

function makeApp(overrides: Partial<SpringBoardAppEntry> & { key: string }): SpringBoardAppEntry {
  return {
    kind: "plugin-page",
    pluginId: overrides.key,
    pageId: "index",
    title: overrides.title ?? overrides.key,
    group: overrides.group ?? "main",
    groupLabel: overrides.groupLabel ?? "常用",
    icon: overrides.icon ?? "default",
    primary: overrides.primary ?? false,
    ...overrides,
  }
}

describe("shell-ios6 manifest", () => {
  it("passes validatePluginManifest as an API v1 shell plugin", () => {
    const parsed = validatePluginManifest(manifest)
    expect(parsed.id).toBe("orahako.shell.ios6")
    expect(parsed.kind).toBe("shell")
    expect(parsed.apiVersion).toBe(1)
    expect(parsed.inject).toContain("ui")
    expect(parsed.inject).toContain("router")
    expect(parsed.inject).toContain("slots")
  })
})

describe("resolveIos6IconKind", () => {
  it("maps core campus & community plugins to distinct iOS 6 icons", () => {
    expect(resolveIos6IconKind({ pluginId: "orahako.overview" })).toBe("overview")
    expect(resolveIos6IconKind({ pluginId: "orahako.schedule" })).toBe("calendar")
    expect(resolveIos6IconKind({ pluginId: "orahako.school-schedule" })).toBe("timetable")
    expect(resolveIos6IconKind({ pluginId: "orahako.grades" })).toBe("grades")
    expect(resolveIos6IconKind({ pluginId: "orahako.comprehensive" })).toBe("trophy")
    expect(resolveIos6IconKind({ pluginId: "orahako.credits" })).toBe("star")
    expect(resolveIos6IconKind({ pluginId: "orahako.exams" })).toBe("clock")
    expect(resolveIos6IconKind({ pluginId: "orahako.makeup-exams" })).toBe("reminders")
    expect(resolveIos6IconKind({ pluginId: "orahako.training-plan" })).toBe("ibooks")
    expect(resolveIos6IconKind({ pluginId: "orahako.labor" })).toBe("notes")
    expect(resolveIos6IconKind({ pluginId: "orahako.ecard" })).toBe("passbook")
    expect(resolveIos6IconKind({ pluginId: "orahako.epay" })).toBe("wallet")
    expect(resolveIos6IconKind({ pluginId: "orahako.meter" })).toBe("meter")
    expect(resolveIos6IconKind({ pluginId: "community.campus-charge" })).toBe("charge")
    expect(resolveIos6IconKind({ pluginId: "orahako.free-rooms" })).toBe("maps")
    expect(resolveIos6IconKind({ pluginId: "orahako.evaluation" })).toBe("mail")
    expect(resolveIos6IconKind({ pluginId: "orahako.notifications" })).toBe("messages")
    expect(resolveIos6IconKind({ pluginId: "orahako.student-info" })).toBe("idcard")
    expect(resolveIos6IconKind({ pluginId: "orahako.profile" })).toBe("contacts")
    expect(resolveIos6IconKind({ pluginId: "orahako.plugin-manager" })).toBe("appstore")
    expect(resolveIos6IconKind({ pluginId: "orahako.settings" })).toBe("settings")
    expect(resolveIos6IconKind({ pluginId: "orahako.skbird" })).toBe("compass")
  })

  it("supports matching by localized title for custom plugins", () => {
    expect(resolveIos6IconKind({ pluginId: "custom.x1", title: "空调电费" })).toBe("meter")
    expect(resolveIos6IconKind({ pluginId: "custom.x2", title: "校园充电" })).toBe("charge")
    expect(resolveIos6IconKind({ pluginId: "custom.x3", title: "补考安排" })).toBe("reminders")
    expect(resolveIos6IconKind({ pluginId: "custom.x4", title: "全校课表" })).toBe("timetable")
  })
})

describe("resolveEffectiveShowStatusBar and store migration", () => {
  it("hides simulated status bar automatically when native safe-area-top > 0", () => {
    expect(
      resolveEffectiveShowStatusBar({
        statusBarMode: "auto",
        hasNativeSafeAreaTop: true,
        isIphoneFrame: false,
      })
    ).toBe(false)

    expect(
      resolveEffectiveShowStatusBar({
        statusBarMode: "auto",
        hasNativeSafeAreaTop: false,
        isIphoneFrame: false,
      })
    ).toBe(true)

    expect(
      resolveEffectiveShowStatusBar({
        statusBarMode: "always",
        hasNativeSafeAreaTop: true,
        isIphoneFrame: false,
      })
    ).toBe(true)

    expect(
      resolveEffectiveShowStatusBar({
        statusBarMode: "off",
        hasNativeSafeAreaTop: false,
        isIphoneFrame: true,
      })
    ).toBe(false)

    expect(
      resolveEffectiveShowStatusBar({
        statusBarMode: "auto",
        hasNativeSafeAreaTop: true,
        isIphoneFrame: true,
      })
    ).toBe(true)
  })

  it("migrates v1 preferences cleanly while preserving existing user toggles", () => {
    const defaults = createDefaultIos6State()
    expect(defaults.statusBarMode).toBe("auto")
    expect(defaults.lightThemeContent).toBe(true)

    const migratedOff = migrateIos6StoreState({
      wallpaper: "linen",
      showStatusBar: false,
      lockScreenEnabled: false,
    })
    expect(migratedOff.wallpaper).toBe("linen")
    expect(migratedOff.statusBarMode).toBe("off")
    expect(migratedOff.showStatusBar).toBe(false)
    expect(migratedOff.lockScreenEnabled).toBe(false)
    expect(migratedOff.lightThemeContent).toBe(true)

    const migratedAuto = migrateIos6StoreState({
      wallpaper: "aurora",
      showStatusBar: true,
    })
    expect(migratedAuto.statusBarMode).toBe("auto")
    expect(migratedAuto.showStatusBar).toBe(true)
  })
})

describe("computeSpringboardSwipe", () => {
  it("tracks horizontal finger drag 1:1 and flips pages past threshold or flick", () => {
    const mid = computeSpringboardSwipe({
      deltaX: -90,
      currentPage: 0,
      totalPages: 3,
      containerWidth: 390,
    })
    expect(mid.visualOffsetPx).toBe(-90)
    expect(mid.nextPage).toBe(1)
    expect(mid.openSpotlight).toBe(false)

    const shortDrag = computeSpringboardSwipe({
      deltaX: -30,
      currentPage: 1,
      totalPages: 3,
      containerWidth: 390,
      velocityPxPerMs: -0.05,
    })
    expect(shortDrag.nextPage).toBe(1)

    const fastFlick = computeSpringboardSwipe({
      deltaX: -32,
      currentPage: 1,
      totalPages: 3,
      containerWidth: 390,
      velocityPxPerMs: -0.5,
    })
    expect(fastFlick.nextPage).toBe(2)
  })

  it("applies rubber-band damping at edges and opens Spotlight past page 0 right pull", () => {
    const leftEdgePull = computeSpringboardSwipe({
      deltaX: 110,
      currentPage: 0,
      totalPages: 2,
      containerWidth: 390,
    })
    expect(leftEdgePull.visualOffsetPx).toBeCloseTo(38.5)
    expect(leftEdgePull.nextPage).toBe(0)
    expect(leftEdgePull.openSpotlight).toBe(true)

    const rightEdgePull = computeSpringboardSwipe({
      deltaX: -100,
      currentPage: 1,
      totalPages: 2,
      containerWidth: 390,
    })
    expect(rightEdgePull.visualOffsetPx).toBeCloseTo(-28)
    expect(rightEdgePull.nextPage).toBe(1)
    expect(rightEdgePull.openSpotlight).toBe(false)
  })
})

describe("resolveGridConfig", () => {
  it("uses 4-column compact grid on mobile viewports", () => {
    const small = resolveGridConfig({ width: 375, height: 667 }, "ipad")
    expect(small.columns).toBe(4)
    expect(small.rows).toBe(3)
    expect(small.isCompact).toBe(true)

    const tall = resolveGridConfig({ width: 390, height: 844 }, "ipad")
    expect(tall.columns).toBe(4)
    expect(tall.rows).toBe(4)
    expect(tall.pageSize).toBe(16)
  })

  it("switches cleanly between iPad grid and iPhone bezel mode on desktop", () => {
    const ipad = resolveGridConfig({ width: 1280, height: 800 }, "ipad")
    expect(ipad.columns).toBe(6)
    expect(ipad.rows).toBe(3)
    expect(ipad.isCompact).toBe(false)

    const iphone = resolveGridConfig({ width: 1280, height: 800 }, "iphone")
    expect(iphone.columns).toBe(4)
    expect(iphone.isCompact).toBe(true)
  })
})

describe("partitionSpringBoardApps", () => {
  const builtins = {
    settingsApp: makeApp({
      key: "builtin:settings",
      kind: "builtin-settings",
      title: "设置",
      icon: "settings",
    }),
    defaultShellApp: makeApp({
      key: "builtin:default-shell",
      kind: "builtin-default-shell",
      title: "切回默认",
      icon: "power",
    }),
  }

  it("keeps Settings in Dock and includes Default Shell switcher on SpringBoard", () => {
    const apps = [
      makeApp({ key: "orahako.overview:index", title: "总览", icon: "overview", primary: true, badgeCount: 2 }),
      makeApp({ key: "orahako.schedule:index", title: "课表", icon: "calendar" }),
      makeApp({ key: "orahako.grades:index", title: "成绩", icon: "grades" }),
      makeApp({ key: "orahako.exams:index", title: "考试", icon: "clock" }),
      makeApp({ key: "orahako.ecard:index", title: "一卡通", icon: "passbook" }),
    ]

    const result = partitionSpringBoardApps(apps, builtins, 4, {
      maxDockItems: 4,
      showBadges: true,
    })

    expect(result.dockApps).toHaveLength(4)
    expect(result.dockApps[3]?.key).toBe("builtin:settings")
    expect(result.dockApps[0]?.badgeCount).toBe(2)

    const flatGridKeys = result.pages.flat().map((a) => a.key)
    expect(flatGridKeys).toContain("builtin:default-shell")
    expect(flatGridKeys).toContain("orahako.exams:index")
    expect(flatGridKeys).toContain("orahako.ecard:index")
    const dockKeys = new Set(result.dockApps.map((a) => a.key))
    for (const k of flatGridKeys) {
      expect(dockKeys.has(k)).toBe(false)
    }
  })

  it("strips badges when showBadges is false", () => {
    const apps = [
      makeApp({ key: "a", title: "通知", icon: "messages", badgeCount: 5 }),
    ]
    const result = partitionSpringBoardApps(apps, builtins, 8, {
      maxDockItems: 4,
      showBadges: false,
    })
    expect(result.allSearchableApps.every((a) => a.badgeCount === undefined)).toBe(true)
  })
})

describe("filterSpotlightResults", () => {
  const apps: readonly SpringBoardAppEntry[] = [
    makeApp({ key: "schedule", title: "课程表", groupLabel: "教务", icon: "calendar" }),
    makeApp({ key: "grades", title: "成绩查询", groupLabel: "教务", icon: "grades" }),
  ]
  const settings: readonly SpringBoardSettingsEntry[] = [
    {
      id: "sys",
      kind: "system-settings",
      title: "系统设置",
      description: "切换外壳与插件配置",
      icon: "settings",
    },
  ]

  it("filters apps and settings case-insensitively", () => {
    const res = filterSpotlightResults(apps, settings, "课程")
    expect(res.apps.map((a) => a.key)).toEqual(["schedule"])
    expect(res.settings).toHaveLength(0)

    const res2 = filterSpotlightResults(apps, settings, "外壳")
    expect(res2.apps).toHaveLength(0)
    expect(res2.settings.map((s) => s.id)).toEqual(["sys"])
  })
})

describe("computeSlideUnlockProgress and session unlock state", () => {
  it("clamps travel offset and unlocks at >= 72% travel", () => {
    const early = computeSlideUnlockProgress(60, 260, 66)
    expect(early.unlocked).toBe(false)
    expect(early.offsetPx).toBe(60)

    const complete = computeSlideUnlockProgress(180, 260, 66)
    expect(complete.unlocked).toBe(true)
    expect(complete.progress).toBeGreaterThanOrEqual(0.72)

    const negative = computeSlideUnlockProgress(-20, 260, 66)
    expect(negative.offsetPx).toBe(0)
    expect(negative.unlocked).toBe(false)
  })

  it("reads and writes session unlock state cleanly", () => {
    const map = new Map<string, string>()
    const mockStorage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    }
    expect(readSessionUnlocked(mockStorage)).toBe(false)
    writeSessionUnlocked(true, mockStorage)
    expect(map.get(SESSION_UNLOCK_KEY)).toBe("1")
    expect(readSessionUnlocked(mockStorage)).toBe(true)
    writeSessionUnlocked(false, mockStorage)
    expect(readSessionUnlocked(mockStorage)).toBe(false)
  })
})

describe("CSS safe-area, banner isolation, reflection and light-viewport tokens", () => {
  it("combines host --safe-area-inset-* variables with env(safe-area-inset-*)", () => {
    expect(IOS6_GLOBAL_CSS).toContain("max(var(--safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))")
    expect(IOS6_GLOBAL_CSS).toContain("max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))")
  })

  it("includes empty banner hiding, dock reflection mask, and light viewport tokens", () => {
    expect(IOS6_GLOBAL_CSS).toContain(".ios6-banner-host:not(:has(*))")
    expect(IOS6_GLOBAL_CSS).toContain(".ios6-dock-reflection")
    expect(IOS6_GLOBAL_CSS).toContain(".ios6-light-viewport")
    expect(IOS6_GLOBAL_CSS).toContain("--background: #eef1f5;")
  })
})
