import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import * as UiPrimitives from "@orahako/ui-primitives"
import { Win98CaptionGlyph, Win98Icon } from "./win98-icons"

type ScopedDialogProvider = ComponentType<{
  readonly container?: HTMLElement | null
  readonly scopedModal?: boolean
  readonly children: ReactNode
}>

const DialogScopeProvider = (
  UiPrimitives as unknown as { readonly DialogScopeProvider?: ScopedDialogProvider }
).DialogScopeProvider
import {
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  TASKBAR_HEIGHT,
  type DesktopWindow,
  type ViewportSize,
  type WindowBounds,
} from "./window-manager"

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

const DOM_LOADING_SELECTOR =
  '[aria-busy="true"], [data-slot="skeleton"], [data-page-status="loading"], .animate-spin'

export function spawnWireframeZoom(from: DOMRect, to: DOMRect): void {
  if (typeof document === "undefined") return
  const wire = document.createElement("div")
  wire.className = "w98-zoom-wire"
  wire.style.setProperty("--w98-from-x", `${Math.round(from.left)}px`)
  wire.style.setProperty("--w98-from-y", `${Math.round(from.top)}px`)
  wire.style.setProperty("--w98-from-w", `${Math.max(16, Math.round(from.width))}px`)
  wire.style.setProperty("--w98-from-h", `${Math.max(16, Math.round(from.height))}px`)
  wire.style.setProperty("--w98-to-x", `${Math.round(to.left)}px`)
  wire.style.setProperty("--w98-to-y", `${Math.round(to.top)}px`)
  wire.style.setProperty("--w98-to-w", `${Math.max(16, Math.round(to.width))}px`)
  wire.style.setProperty("--w98-to-h", `${Math.max(16, Math.round(to.height))}px`)
  document.body.appendChild(wire)
  window.setTimeout(() => {
    wire.remove()
  }, 180)
}

export interface Win98WindowMenuActions {
  readonly onCascade: () => void
  readonly onTileH: () => void
  readonly onTileV: () => void
  readonly onOpenExplorer: () => void
  readonly onOpenDisplayProps: () => void
  readonly onOpenAbout: () => void
}

export interface Win98WindowProps {
  readonly win: DesktopWindow
  readonly isActive: boolean
  readonly viewport: ViewportSize
  readonly statusText: string
  readonly loadingStatusText: string
  readonly isHttpLoading: boolean
  readonly menuActions?: Win98WindowMenuActions
  readonly labels: {
    readonly minimize: string
    readonly maximize: string
    readonly restore: string
    readonly close: string
    readonly menuWindow: string
    readonly menuView: string
    readonly menuHelp: string
    readonly cascade: string
    readonly tileH: string
    readonly tileV: string
    readonly explorer: string
    readonly displayProps: string
    readonly about: string
  }
  readonly onFocus: () => void
  readonly onMinimize: (windowRect: DOMRect | null) => void
  readonly onToggleMaximize: () => void
  readonly onClose: () => void
  readonly onBoundsChange: (bounds: WindowBounds) => void
  readonly children: ReactNode
}

const RESIZE_HANDLES: readonly {
  readonly dir: ResizeDirection
  readonly style: React.CSSProperties
}[] = [
  { dir: "n", style: { top: -3, left: 6, right: 6, height: 6, cursor: "ns-resize" } },
  { dir: "s", style: { bottom: -3, left: 6, right: 6, height: 6, cursor: "ns-resize" } },
  { dir: "e", style: { right: -3, top: 6, bottom: 6, width: 6, cursor: "ew-resize" } },
  { dir: "w", style: { left: -3, top: 6, bottom: 6, width: 6, cursor: "ew-resize" } },
  { dir: "nw", style: { top: -3, left: -3, width: 10, height: 10, cursor: "nwse-resize" } },
  { dir: "ne", style: { top: -3, right: -3, width: 10, height: 10, cursor: "nesw-resize" } },
  { dir: "sw", style: { bottom: -3, left: -3, width: 10, height: 10, cursor: "nesw-resize" } },
  { dir: "se", style: { bottom: -3, right: -3, width: 10, height: 10, cursor: "nwse-resize" } },
]

export function Win98Window({
  win,
  isActive,
  viewport,
  statusText,
  loadingStatusText,
  isHttpLoading,
  menuActions,
  labels,
  onFocus,
  onMinimize,
  onToggleMaximize,
  onClose,
  onBoundsChange,
  children,
}: Win98WindowProps): ReactNode {
  const frameRef = useRef<HTMLElement | null>(null)
  const [hostEl, setHostEl] = useState<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [resizingSize, setResizingSize] = useState<{ width: number; height: number } | null>(null)
  const [domLoading, setDomLoading] = useState(false)
  const [openMenu, setOpenMenu] = useState<"window" | "view" | "help" | null>(null)

  const setFrameNode = useCallback((node: HTMLElement | null) => {
    frameRef.current = node
    setHostEl(node)
  }, [])

  // Allow dragging scoped modal dialogs inside this window by their top 26px Win98 titlebar strip
  useEffect(() => {
    if (!hostEl) return
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (!target || target.closest("button")) return
      const dialog = target.closest<HTMLElement>(
        '[data-slot="dialog-content"][data-scoped-modal="true"]'
      )
      if (!dialog) return
      const rect = dialog.getBoundingClientRect()
      if (event.clientY - rect.top > 28) return

      event.preventDefault()
      event.stopPropagation()
      const startX = event.clientX
      const startY = event.clientY
      const curDx = Number(dialog.dataset.w98Dx ?? "0") || 0
      const curDy = Number(dialog.dataset.w98Dy ?? "0") || 0

      const onMove = (moveEvent: PointerEvent) => {
        const nextDx = curDx + (moveEvent.clientX - startX)
        const nextDy = curDy + (moveEvent.clientY - startY)
        dialog.dataset.w98Dx = String(Math.round(nextDx))
        dialog.dataset.w98Dy = String(Math.round(nextDy))
        dialog.style.translate = `calc(-50% + ${Math.round(nextDx)}px) calc(-50% + ${Math.round(nextDy)}px)`
      }
      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        window.removeEventListener("pointercancel", onUp)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
      window.addEventListener("pointercancel", onUp)
    }

    hostEl.addEventListener("pointerdown", handlePointerDown)
    return () => hostEl.removeEventListener("pointerdown", handlePointerDown)
  }, [hostEl])

  // Observe per-window DOM loading indicators (skeletons, spinners, aria-busy)
  useEffect(() => {
    if (win.kind !== "plugin-page") return
    const node = viewportRef.current
    if (!node || typeof MutationObserver === "undefined") return

    let rafId = 0
    const check = () => {
      rafId = 0
      const hasIndicator = Boolean(node.querySelector(DOM_LOADING_SELECTOR))
      setDomLoading((prev) => (prev === hasIndicator ? prev : hasIndicator))
    }

    check()
    const observer = new MutationObserver(() => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(check)
      }
    })
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-busy", "class", "data-slot", "data-page-status"],
    })
    return () => {
      observer.disconnect()
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [win.kind])

  // Close window menu bar when window loses focus
  useEffect(() => {
    if (!isActive && openMenu !== null) {
      setOpenMenu(null)
    }
  }, [isActive, openMenu])

  const effectiveLoading = (isActive && isHttpLoading) || domLoading
  const effectiveStatusText = effectiveLoading ? loadingStatusText : statusText

  const handleTitlebarPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest("button")) return
    setOpenMenu(null)
    onFocus()
    if (win.maximized) return

    event.preventDefault()
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const startX = event.clientX
    const startY = event.clientY
    const origin = win.bounds

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      onBoundsChange({
        ...origin,
        x: origin.x + dx,
        y: origin.y + dy,
      })
    }

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
  }

  const handleResizePointerDown = (
    dir: ResizeDirection,
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (event.button !== 0 || win.maximized) return
    event.preventDefault()
    event.stopPropagation()
    setOpenMenu(null)
    onFocus()

    const startX = event.clientX
    const startY = event.clientY
    const origin = win.bounds
    const maxH = Math.max(MIN_WINDOW_HEIGHT, viewport.height - TASKBAR_HEIGHT)

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      let nextX = origin.x
      let nextY = origin.y
      let nextW = origin.width
      let nextH = origin.height

      if (dir.includes("e")) {
        nextW = Math.max(MIN_WINDOW_WIDTH, origin.width + dx)
      }
      if (dir.includes("s")) {
        nextH = Math.min(maxH - origin.y, Math.max(MIN_WINDOW_HEIGHT, origin.height + dy))
      }
      if (dir.includes("w")) {
        const candidateW = origin.width - dx
        if (candidateW >= MIN_WINDOW_WIDTH) {
          nextW = candidateW
          nextX = origin.x + dx
        }
      }
      if (dir.includes("n")) {
        const candidateH = origin.height - dy
        if (candidateH >= MIN_WINDOW_HEIGHT && origin.y + dy >= 0) {
          nextH = candidateH
          nextY = origin.y + dy
        }
      }

      setResizingSize({ width: Math.round(nextW), height: Math.round(nextH) })
      onBoundsChange({ x: nextX, y: nextY, width: nextW, height: nextH })
    }

    const handleUp = () => {
      setResizingSize(null)
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
  }

  const frameStyle: React.CSSProperties = win.maximized
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: `calc(100dvh - ${TASKBAR_HEIGHT}px)`,
        zIndex: win.zIndex,
        display: win.minimized ? "none" : "flex",
      }
    : {
        position: "fixed",
        top: win.bounds.y,
        left: win.bounds.x,
        width: win.bounds.width,
        height: win.bounds.height,
        zIndex: win.zIndex,
        display: win.minimized ? "none" : "flex",
      }

  return (
    <section
      ref={setFrameNode}
      data-win98-window={win.id}
      data-win98-active={isActive ? "true" : "false"}
      aria-label={win.title}
      className="w98-window flex-col p-[3px] select-none"
      style={frameStyle}
      onPointerDown={() => {
        if (!isActive) onFocus()
      }}
    >
      {/* Titlebar */}
      <div
        className={`flex h-[22px] shrink-0 items-center gap-1.5 px-1 ${
          isActive ? "w98-titlebar-active" : "w98-titlebar-inactive"
        }`}
        style={{ cursor: win.maximized ? "default" : "move", touchAction: "none" }}
        onPointerDown={handleTitlebarPointerDown}
        onDoubleClick={onToggleMaximize}
      >
        <Win98Icon kind={win.icon} size={15} />
        <span className="min-w-0 flex-1 truncate text-[12px] leading-none font-bold tracking-[0.01em]">
          {win.title}
        </span>
        <div className="flex shrink-0 items-center gap-[2px]">
          <button
            type="button"
            className="w98-btn flex h-[16px] w-[18px] items-center justify-center p-0"
            title={labels.minimize}
            aria-label={labels.minimize}
            onClick={(event) => {
              event.stopPropagation()
              onMinimize(frameRef.current?.getBoundingClientRect() ?? null)
            }}
          >
            <Win98CaptionGlyph kind="min" />
          </button>
          <button
            type="button"
            className="w98-btn flex h-[16px] w-[18px] items-center justify-center p-0"
            title={win.maximized ? labels.restore : labels.maximize}
            aria-label={win.maximized ? labels.restore : labels.maximize}
            onClick={(event) => {
              event.stopPropagation()
              onToggleMaximize()
            }}
          >
            <Win98CaptionGlyph kind={win.maximized ? "restore" : "max"} />
          </button>
          <button
            type="button"
            className="w98-btn ml-[2px] flex h-[16px] w-[18px] items-center justify-center p-0"
            title={labels.close}
            aria-label={labels.close}
            onClick={(event) => {
              event.stopPropagation()
              onClose()
            }}
          >
            <Win98CaptionGlyph kind="close" />
          </button>
        </div>
      </div>

      {/* Classic Win98 Application Menu Bar (for plugin-page windows) */}
      {win.kind === "plugin-page" && menuActions && (
        <div
          className="relative mt-[1px] flex h-[20px] shrink-0 items-center gap-0.5 px-0.5 text-[11px]"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="relative">
            <button
              type="button"
              className="px-1.5 py-0.5"
              style={
                openMenu === "window"
                  ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                  : undefined
              }
              onClick={() => setOpenMenu((prev) => (prev === "window" ? null : "window"))}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu("window")
              }}
            >
              {labels.menuWindow}
            </button>
            {openMenu === "window" && (
              <div className="w98-window absolute top-full left-0 z-[40] w-[156px] p-[3px] text-[12px]">
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    onMinimize(frameRef.current?.getBoundingClientRect() ?? null)
                  }}
                >
                  {labels.minimize}
                </button>
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    onToggleMaximize()
                  }}
                >
                  {win.maximized ? labels.restore : labels.maximize}
                </button>
                <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    menuActions.onCascade()
                  }}
                >
                  {labels.cascade}
                </button>
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    menuActions.onTileH()
                  }}
                >
                  {labels.tileH}
                </button>
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    menuActions.onTileV()
                  }}
                >
                  {labels.tileV}
                </button>
                <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    onClose()
                  }}
                >
                  {labels.close}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="px-1.5 py-0.5"
              style={
                openMenu === "view"
                  ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                  : undefined
              }
              onClick={() => setOpenMenu((prev) => (prev === "view" ? null : "view"))}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu("view")
              }}
            >
              {labels.menuView}
            </button>
            {openMenu === "view" && (
              <div className="w98-window absolute top-full left-0 z-[40] w-[156px] p-[3px] text-[12px]">
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    menuActions.onOpenExplorer()
                  }}
                >
                  {labels.explorer}
                </button>
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    menuActions.onOpenDisplayProps()
                  }}
                >
                  {labels.displayProps}
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="px-1.5 py-0.5"
              style={
                openMenu === "help"
                  ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                  : undefined
              }
              onClick={() => setOpenMenu((prev) => (prev === "help" ? null : "help"))}
              onMouseEnter={() => {
                if (openMenu !== null) setOpenMenu("help")
              }}
            >
              {labels.menuHelp}
            </button>
            {openMenu === "help" && (
              <div className="w98-window absolute top-full left-0 z-[40] w-[156px] p-[3px] text-[12px]">
                <button
                  type="button"
                  className="w98-menu-item block w-full px-2.5 py-1 text-left"
                  onClick={() => {
                    setOpenMenu(null)
                    menuActions.onOpenAbout()
                  }}
                >
                  {labels.about}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content viewport — p-[2px] keeps scrolled content strictly inside the 2px sunken bevel,
          and transform+contain makes this viewport the containing block for plugin `position: fixed` overlays */}
      <div
        ref={viewportRef}
        className="w98-sunken relative mt-[2px] flex min-h-0 flex-1 flex-col overflow-hidden p-[2px] select-text"
        style={{ transform: "translateZ(0)", contain: "layout paint" }}
        data-w98-page-viewport={
          win.kind === "plugin-page" || win.kind === "settings-category" ? "true" : undefined
        }
        onPointerDown={() => {
          if (openMenu !== null) setOpenMenu(null)
        }}
      >
        <div
          className={`min-h-0 min-w-0 flex-1 overflow-auto ${
            win.kind === "plugin-page" || win.kind === "settings-category" ? "p-3.5 sm:p-4" : ""
          }`}
        >
          {DialogScopeProvider &&
          (win.kind === "plugin-page" || win.kind === "settings-category") ? (
            <DialogScopeProvider container={hostEl} scopedModal>
              {children}
            </DialogScopeProvider>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Classic Win98 Status Bar with live loading indicator */}
      <div className="mt-[2px] flex h-[20px] shrink-0 items-center gap-[3px] text-[11px] leading-none">
        <div className="w98-sunken-tray flex h-full min-w-0 flex-1 items-center gap-1.5 truncate px-1.5">
          <span className="truncate">{effectiveStatusText}</span>
        </div>
        {effectiveLoading && (
          <div className="w98-sunken-tray flex h-full shrink-0 items-center px-1">
            <div className="w98-status-progress" aria-label={effectiveStatusText}>
              <div className="w98-status-progress-bar" />
            </div>
          </div>
        )}
        <div className="w98-sunken-tray flex h-full shrink-0 items-center px-2 text-[#404040]">
          {resizingSize
            ? `${resizingSize.width} × ${resizingSize.height}`
            : (win.pluginId ?? "ORAHAKO.EXE")}
        </div>
      </div>

      {/* 8-directional resize handles (disabled when maximized) */}
      {!win.maximized &&
        RESIZE_HANDLES.map((handle) => (
          <div
            key={handle.dir}
            style={{ position: "absolute", ...handle.style, touchAction: "none" }}
            onPointerDown={(event) => handleResizePointerDown(handle.dir, event)}
          />
        ))}
    </section>
  )
}
