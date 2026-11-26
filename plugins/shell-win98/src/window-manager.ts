import type { Win98IconKind } from "./win98-icons"

export type DesktopWindowKind =
  | "plugin-page"
  | "explorer"
  | "control-panel"
  | "settings-category"
  | "display"
  | "about"

export interface WindowBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface DesktopWindow {
  readonly id: string
  readonly kind: DesktopWindowKind
  readonly pluginId?: string
  readonly pageId?: string
  readonly routeParams?: Readonly<Record<string, string>>
  readonly categoryId?: string
  readonly title: string
  readonly icon: Win98IconKind
  readonly bounds: WindowBounds
  readonly prevBounds?: WindowBounds
  readonly zIndex: number
  readonly minimized: boolean
  readonly maximized: boolean
}

export interface ViewportSize {
  readonly width: number
  readonly height: number
}

export const TASKBAR_HEIGHT = 34
export const MIN_WINDOW_WIDTH = 320
export const MIN_WINDOW_HEIGHT = 240
export const BASE_WINDOW_Z = 10

export function pluginWindowId(pluginId: string, pageId: string): string {
  return `page:${pluginId}:${pageId}`
}

function normalizeZOrder(windows: readonly DesktopWindow[]): DesktopWindow[] {
  const ordered = [...windows].sort((a, b) => a.zIndex - b.zIndex)
  const zById = new Map<string, number>()
  ordered.forEach((win, index) => {
    // Keep strictly below Radix portal z-index (50)
    zById.set(win.id, BASE_WINDOW_Z + Math.min(index, 29))
  })
  return windows.map((win) => ({
    ...win,
    zIndex: zById.get(win.id) ?? BASE_WINDOW_Z,
  }))
}

export function getTopFocusedWindowId(windows: readonly DesktopWindow[]): string | null {
  let top: DesktopWindow | null = null
  for (const win of windows) {
    if (win.minimized) continue
    if (!top || win.zIndex > top.zIndex) {
      top = win
    }
  }
  return top?.id ?? null
}

export function clampBoundsToViewport(
  bounds: WindowBounds,
  viewport: ViewportSize
): WindowBounds {
  const usableH = Math.max(MIN_WINDOW_HEIGHT, viewport.height - TASKBAR_HEIGHT)
  const usableW = Math.max(MIN_WINDOW_WIDTH, viewport.width)
  const width = Math.min(Math.max(bounds.width, MIN_WINDOW_WIDTH), usableW)
  const height = Math.min(Math.max(bounds.height, MIN_WINDOW_HEIGHT), usableH)
  const maxX = Math.max(0, usableW - 80)
  const maxY = Math.max(0, usableH - 36)
  const x = Math.min(Math.max(bounds.x, -(width - 100)), maxX)
  const y = Math.min(Math.max(bounds.y, 0), maxY)
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }
}

export function computeInitialBounds(
  kind: DesktopWindowKind,
  openCount: number,
  viewport: ViewportSize
): { readonly bounds: WindowBounds; readonly maximized: boolean } {
  const usableW = Math.max(MIN_WINDOW_WIDTH, viewport.width)
  const usableH = Math.max(MIN_WINDOW_HEIGHT, viewport.height - TASKBAR_HEIGHT)
  const isCompact = viewport.width < 768

  if (isCompact) {
    return {
      bounds: { x: 0, y: 0, width: usableW, height: usableH },
      maximized: true,
    }
  }

  let defaultW = Math.min(920, Math.round(usableW * 0.74))
  let defaultH = Math.min(640, Math.round(usableH * 0.8))

  if (kind === "explorer" || kind === "control-panel") {
    defaultW = Math.min(720, Math.round(usableW * 0.62))
    defaultH = Math.min(500, Math.round(usableH * 0.7))
  } else if (kind === "settings-category") {
    defaultW = Math.min(620, Math.round(usableW * 0.56))
    defaultH = Math.min(540, Math.round(usableH * 0.72))
  } else if (kind === "display") {
    defaultW = 440
    defaultH = 490
  } else if (kind === "about") {
    defaultW = 420
    defaultH = 300
  }

  const cascadeStep = 28
  const slot = openCount % 7
  const baseLeft = kind === "plugin-page" ? 116 : 148
  const baseTop = 26
  const rawX = baseLeft + slot * cascadeStep
  const rawY = baseTop + slot * cascadeStep

  const maxX = Math.max(12, usableW - defaultW - 12)
  const maxY = Math.max(12, usableH - defaultH - 12)

  return {
    bounds: {
      x: Math.min(rawX, maxX),
      y: Math.min(rawY, maxY),
      width: Math.max(MIN_WINDOW_WIDTH, Math.min(defaultW, usableW - 24)),
      height: Math.max(MIN_WINDOW_HEIGHT, Math.min(defaultH, usableH - 24)),
    },
    maximized: false,
  }
}

export function openOrFocusWindow(
  windows: readonly DesktopWindow[],
  spec: {
    readonly id: string
    readonly kind: DesktopWindowKind
    readonly pluginId?: string
    readonly pageId?: string
    readonly routeParams?: Readonly<Record<string, string>>
    readonly categoryId?: string
    readonly title: string
    readonly icon: Win98IconKind
  },
  viewport: ViewportSize
): DesktopWindow[] {
  const existing = windows.find((win) => win.id === spec.id)
  const highestZ = windows.reduce((max, win) => Math.max(max, win.zIndex), BASE_WINDOW_Z)
  if (existing) {
    return normalizeZOrder(
      windows.map((win) =>
        win.id === spec.id
          ? {
              ...win,
              title: spec.title,
              icon: spec.icon,
              ...(spec.routeParams !== undefined ? { routeParams: spec.routeParams } : {}),
              minimized: false,
              zIndex: highestZ + 1,
            }
          : win
      )
    )
  }

  const { bounds, maximized } = computeInitialBounds(spec.kind, windows.length, viewport)
  const next: DesktopWindow = {
    id: spec.id,
    kind: spec.kind,
    ...(spec.pluginId !== undefined ? { pluginId: spec.pluginId } : {}),
    ...(spec.pageId !== undefined ? { pageId: spec.pageId } : {}),
    ...(spec.routeParams !== undefined ? { routeParams: spec.routeParams } : {}),
    ...(spec.categoryId !== undefined ? { categoryId: spec.categoryId } : {}),
    title: spec.title,
    icon: spec.icon,
    bounds,
    zIndex: highestZ + 1,
    minimized: false,
    maximized,
  }
  return normalizeZOrder([...windows, next])
}

export function focusWindow(windows: readonly DesktopWindow[], id: string): DesktopWindow[] {
  const highestZ = windows.reduce((max, win) => Math.max(max, win.zIndex), BASE_WINDOW_Z)
  return normalizeZOrder(
    windows.map((win) =>
      win.id === id ? { ...win, minimized: false, zIndex: highestZ + 1 } : win
    )
  )
}

export function closeWindow(windows: readonly DesktopWindow[], id: string): DesktopWindow[] {
  return normalizeZOrder(windows.filter((win) => win.id !== id))
}

export function minimizeWindow(windows: readonly DesktopWindow[], id: string): DesktopWindow[] {
  return windows.map((win) => (win.id === id ? { ...win, minimized: true } : win))
}

export function toggleMaximizeWindow(
  windows: readonly DesktopWindow[],
  id: string
): DesktopWindow[] {
  const highestZ = windows.reduce((max, win) => Math.max(max, win.zIndex), BASE_WINDOW_Z)
  return normalizeZOrder(
    windows.map((win) => {
      if (win.id !== id) return win
      if (win.maximized) {
        return {
          ...win,
          maximized: false,
          bounds: win.prevBounds ?? win.bounds,
          zIndex: highestZ + 1,
        }
      }
      return {
        ...win,
        maximized: true,
        prevBounds: win.bounds,
        minimized: false,
        zIndex: highestZ + 1,
      }
    })
  )
}

export function updateWindowBounds(
  windows: readonly DesktopWindow[],
  id: string,
  bounds: WindowBounds,
  viewport: ViewportSize
): DesktopWindow[] {
  const clamped = clampBoundsToViewport(bounds, viewport)
  return windows.map((win) => (win.id === id ? { ...win, bounds: clamped } : win))
}

export function cascadeWindows(
  windows: readonly DesktopWindow[],
  viewport: ViewportSize
): DesktopWindow[] {
  const usableW = Math.max(MIN_WINDOW_WIDTH, viewport.width)
  const usableH = Math.max(MIN_WINDOW_HEIGHT, viewport.height - TASKBAR_HEIGHT)
  const width = Math.min(820, Math.round(usableW * 0.68))
  const height = Math.min(560, Math.round(usableH * 0.72))
  let visibleIndex = 0
  return normalizeZOrder(
    windows.map((win) => {
      if (win.minimized) return win
      const offset = (visibleIndex % 8) * 28
      visibleIndex += 1
      return {
        ...win,
        maximized: false,
        bounds: clampBoundsToViewport(
          { x: 108 + offset, y: 20 + offset, width, height },
          viewport
        ),
        zIndex: BASE_WINDOW_Z + visibleIndex,
      }
    })
  )
}

export function tileWindows(
  windows: readonly DesktopWindow[],
  viewport: ViewportSize,
  orientation: "horizontal" | "vertical"
): DesktopWindow[] {
  const visible = windows.filter((win) => !win.minimized)
  if (visible.length === 0) return [...windows]
  const usableW = Math.max(MIN_WINDOW_WIDTH, viewport.width)
  const usableH = Math.max(MIN_WINDOW_HEIGHT, viewport.height - TASKBAR_HEIGHT)
  const count = visible.length
  const tileMap = new Map<string, WindowBounds>()

  visible.forEach((win, i) => {
    if (orientation === "vertical") {
      const colW = Math.floor(usableW / count)
      tileMap.set(win.id, {
        x: i * colW,
        y: 0,
        width: i === count - 1 ? usableW - i * colW : colW,
        height: usableH,
      })
    } else {
      const rowH = Math.floor(usableH / count)
      tileMap.set(win.id, {
        x: 0,
        y: i * rowH,
        width: usableW,
        height: i === count - 1 ? usableH - i * rowH : rowH,
      })
    }
  })

  return windows.map((win) => {
    const nextBounds = tileMap.get(win.id)
    if (!nextBounds) return win
    return { ...win, maximized: false, bounds: nextBounds }
  })
}

export function minimizeAllWindows(windows: readonly DesktopWindow[]): DesktopWindow[] {
  return windows.map((win) => ({ ...win, minimized: true }))
}
