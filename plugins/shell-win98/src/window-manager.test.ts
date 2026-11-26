import { describe, expect, it } from "vitest"
import {
  BASE_WINDOW_Z,
  cascadeWindows,
  closeWindow,
  focusWindow,
  getTopFocusedWindowId,
  minimizeAllWindows,
  minimizeWindow,
  openOrFocusWindow,
  pluginWindowId,
  TASKBAR_HEIGHT,
  tileWindows,
  toggleMaximizeWindow,
  updateWindowBounds,
  type DesktopWindow,
  type ViewportSize,
} from "./window-manager"
import { resolveWin98IconKind } from "./win98-icons"

const DESKTOP: ViewportSize = { width: 1280, height: 800 }

describe("Win98 window-manager", () => {
  it("opens, cascades, focuses, and keeps z-index strictly below portal z-50", () => {
    let windows: DesktopWindow[] = []
    for (let i = 0; i < 40; i += 1) {
      windows = openOrFocusWindow(
        windows,
        {
          id: pluginWindowId(`plugin.${i}`, "index"),
          kind: "plugin-page",
          pluginId: `plugin.${i}`,
          pageId: "index",
          title: `App ${i}`,
          icon: "document",
        },
        DESKTOP
      )
    }

    expect(windows).toHaveLength(40)
    for (const win of windows) {
      expect(win.zIndex).toBeGreaterThanOrEqual(BASE_WINDOW_Z)
      expect(win.zIndex).toBeLessThan(50)
    }

    const firstId = pluginWindowId("plugin.0", "index")
    windows = focusWindow(windows, firstId)
    expect(getTopFocusedWindowId(windows)).toBe(firstId)
  })

  it("re-focuses and un-minimizes an already open window instead of duplicating", () => {
    let windows = openOrFocusWindow(
      [],
      {
        id: pluginWindowId("orahako.schedule", "index"),
        kind: "plugin-page",
        pluginId: "orahako.schedule",
        pageId: "index",
        title: "课表",
        icon: "schedule",
      },
      DESKTOP
    )
    const id = windows[0]!.id
    windows = minimizeWindow(windows, id)
    expect(windows[0]!.minimized).toBe(true)
    expect(getTopFocusedWindowId(windows)).toBeNull()

    windows = openOrFocusWindow(
      windows,
      {
        id,
        kind: "plugin-page",
        pluginId: "orahako.schedule",
        pageId: "index",
        title: "课表",
        icon: "schedule",
      },
      DESKTOP
    )
    expect(windows).toHaveLength(1)
    expect(windows[0]!.minimized).toBe(false)
    expect(getTopFocusedWindowId(windows)).toBe(id)
  })

  it("toggles maximize and restores previous bounds", () => {
    let windows = openOrFocusWindow(
      [],
      {
        id: "win98:explorer",
        kind: "explorer",
        title: "我的酸橙盒",
        icon: "computer",
      },
      DESKTOP
    )
    const original = windows[0]!.bounds
    windows = toggleMaximizeWindow(windows, "win98:explorer")
    expect(windows[0]!.maximized).toBe(true)
    expect(windows[0]!.prevBounds).toEqual(original)

    windows = toggleMaximizeWindow(windows, "win98:explorer")
    expect(windows[0]!.maximized).toBe(false)
    expect(windows[0]!.bounds).toEqual(original)
  })

  it("tiles visible windows horizontally and vertically and skips minimized ones", () => {
    let windows = openOrFocusWindow(
      [],
      { id: "a", kind: "plugin-page", title: "A", icon: "document" },
      DESKTOP
    )
    windows = openOrFocusWindow(
      windows,
      { id: "b", kind: "plugin-page", title: "B", icon: "document" },
      DESKTOP
    )
    windows = openOrFocusWindow(
      windows,
      { id: "c", kind: "plugin-page", title: "C", icon: "document" },
      DESKTOP
    )
    windows = minimizeWindow(windows, "c")

    const vertical = tileWindows(windows, DESKTOP, "vertical")
    const winA = vertical.find((w) => w.id === "a")!
    const winB = vertical.find((w) => w.id === "b")!
    expect(winA.bounds).toEqual({ x: 0, y: 0, width: 640, height: DESKTOP.height - TASKBAR_HEIGHT })
    expect(winB.bounds).toEqual({
      x: 640,
      y: 0,
      width: 640,
      height: DESKTOP.height - TASKBAR_HEIGHT,
    })

    const horizontal = tileWindows(windows, DESKTOP, "horizontal")
    const hA = horizontal.find((w) => w.id === "a")!
    const hB = horizontal.find((w) => w.id === "b")!
    expect(hA.bounds.width).toBe(1280)
    expect(hB.bounds.y).toBe(hA.bounds.height)

    const cascaded = cascadeWindows(horizontal, DESKTOP)
    expect(cascaded.find((w) => w.id === "a")!.bounds.x).toBe(108)
    expect(cascaded.find((w) => w.id === "b")!.bounds.x).toBe(136)

    const allMin = minimizeAllWindows(cascaded)
    expect(allMin.every((w) => w.minimized)).toBe(true)

    const afterClose = closeWindow(allMin, "b")
    expect(afterClose.map((w) => w.id)).toEqual(["a", "c"])
  })

  it("clamps dragged/resized bounds inside viewport", () => {
    let windows = openOrFocusWindow(
      [],
      { id: "a", kind: "plugin-page", title: "A", icon: "document" },
      DESKTOP
    )
    windows = updateWindowBounds(windows, "a", { x: 20, y: -100, width: 100, height: 100 }, DESKTOP)
    expect(windows[0]!.bounds.y).toBe(0)
    expect(windows[0]!.bounds.width).toBeGreaterThanOrEqual(320)
    expect(windows[0]!.bounds.height).toBeGreaterThanOrEqual(240)
  })

  it("maps plugin hints to matching Win98 icons", () => {
    expect(resolveWin98IconKind({ pluginId: "orahako.schedule" })).toBe("schedule")
    expect(resolveWin98IconKind({ pluginId: "orahako.grades" })).toBe("grades")
    expect(resolveWin98IconKind({ pluginId: "orahako.settings" })).toBe("settings")
    expect(resolveWin98IconKind({ pluginId: "orahako.plugin-manager" })).toBe("plugins")
    expect(resolveWin98IconKind({ pluginId: "orahako.ecard" })).toBe("wallet")
  })
})
