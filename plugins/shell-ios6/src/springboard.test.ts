import { describe, expect, it } from "vitest"
import { validatePluginManifest } from "@orahako/sdk"
import manifest from "../manifest.json"
import { IOS6_GLOBAL_CSS } from "./ios6-styles"
import {
  computeSlideUnlockProgress,
  filterSpotlightResults,
  partitionSpringBoardApps,
  readSessionUnlocked,
  resolveGridConfig,
  resolveIos6IconKind,
  SESSION_UNLOCK_KEY,
  writeSessionUnlocked,
  type SpringBoardAppEntry,
  type SpringBoardSettingsEntry,
} from "./springboard"

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
  it("maps core campus & platform plugins to classic iOS 6 icons", () => {
    expect(resolveIos6IconKind({ pluginId: "orahako.overview" })).toBe("overview")
    expect(resolveIos6IconKind({ pluginId: "orahako.schedule" })).toBe("calendar")
    expect(resolveIos6IconKind({ pluginId: "orahako.grades" })).toBe("grades")
    expect(resolveIos6IconKind({ pluginId: "orahako.exams" })).toBe("notes")
    expect(resolveIos6IconKind({ pluginId: "orahako.ecard" })).toBe("passbook")
    expect(resolveIos6IconKind({ pluginId: "orahako.notifications" })).toBe("messages")
    expect(resolveIos6IconKind({ pluginId: "orahako.plugin-manager" })).toBe("appstore")
    expect(resolveIos6IconKind({ pluginId: "orahako.settings" })).toBe("settings")
    expect(resolveIos6IconKind({ pluginId: "orahako.profile" })).toBe("contacts")
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
      makeApp({ key: "orahako.exams:index", title: "考试", icon: "notes" }),
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
    // No duplicate keys between dock and pages
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

describe("safe-area inset CSS support", () => {
  it("combines host --safe-area-inset-* variables with env(safe-area-inset-*)", () => {
    expect(IOS6_GLOBAL_CSS).toContain("max(var(--safe-area-inset-top, 0px), env(safe-area-inset-top, 0px))")
    expect(IOS6_GLOBAL_CSS).toContain("max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))")
  })
})
