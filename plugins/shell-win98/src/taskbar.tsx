import { useEffect, useState, type ReactNode } from "react"
import type { DesktopAppEntry } from "./desktop-apps"
import { Win98Icon } from "./win98-icons"
import { TASKBAR_HEIGHT, type DesktopWindow } from "./window-manager"

export interface TaskbarProps {
  readonly brand: string
  readonly windows: readonly DesktopWindow[]
  readonly activeWindowId: string | null
  readonly apps: readonly DesktopAppEntry[]
  readonly startMenuOpen: boolean
  readonly onToggleStartMenu: () => void
  readonly onCloseStartMenu: () => void
  readonly onOpenApp: (app: DesktopAppEntry) => void
  readonly onOpenExplorer: () => void
  readonly onOpenControlPanel: () => void
  readonly onOpenDisplayProps: () => void
  readonly onOpenAbout: () => void
  readonly onShowDesktop: () => void
  readonly onSwitchDefaultShell: () => void
  readonly onTaskButtonClick: (win: DesktopWindow, buttonRect: DOMRect | null) => void
  readonly activitySlot: ReactNode
  readonly headerActionsSlot: ReactNode
  readonly isNetworkBusy: boolean
  readonly networkTooltip: string
  readonly labels: {
    readonly start: string
    readonly programs: string
    readonly explorer: string
    readonly controlPanel: string
    readonly displayProps: string
    readonly about: string
    readonly restoreDefault: string
    readonly showDesktop: string
  }
}

function formatClock(now: Date): string {
  const hh = String(now.getHours()).padStart(2, "0")
  const mm = String(now.getMinutes()).padStart(2, "0")
  return `${hh}:${mm}`
}

export function Win98Taskbar({
  brand,
  windows,
  activeWindowId,
  apps,
  startMenuOpen,
  onToggleStartMenu,
  onCloseStartMenu,
  onOpenApp,
  onOpenExplorer,
  onOpenControlPanel,
  onOpenDisplayProps,
  onOpenAbout,
  onShowDesktop,
  onSwitchDefaultShell,
  onTaskButtonClick,
  activitySlot,
  headerActionsSlot,
  isNetworkBusy,
  networkTooltip,
  labels,
}: TaskbarProps): ReactNode {
  const [clock, setClock] = useState<string>(() => formatClock(new Date()))
  const [dateTitle, setDateTitle] = useState<string>(() => new Date().toLocaleDateString())
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = new Date()
      setClock(formatClock(now))
      setDateTitle(now.toLocaleDateString())
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [])

  // Group apps for cascading Start -> Programs submenus
  const groups = new Map<string, { readonly label: string; readonly items: DesktopAppEntry[] }>()
  for (const app of apps) {
    const existing = groups.get(app.group)
    if (existing) {
      existing.items.push(app)
    } else {
      groups.set(app.group, { label: app.groupLabel, items: [app] })
    }
  }
  const groupEntries = Array.from(groups.entries())

  return (
    <>
      {/* Start Menu Popup */}
      {startMenuOpen && (
        <div
          data-win98-start-menu="true"
          className="w98-window fixed bottom-[34px] left-[2px] z-[46] flex w-[236px] p-[3px] text-[12px] text-black select-none"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Iconic Vertical Windows 98 Sidebar */}
          <div
            className="flex w-[24px] shrink-0 items-end justify-center pb-2 text-white"
            style={{
              background: "linear-gradient(0deg, var(--w98-title-a) 0%, var(--w98-title-b) 100%)",
            }}
          >
            {(() => {
              const hasCjk = /[\u4e00-\u9fff]/.test(brand)
              return (
                <span
                  className="text-[13px] font-bold tracking-wider whitespace-nowrap"
                  style={
                    hasCjk
                      ? { writingMode: "vertical-rl", textOrientation: "upright" }
                      : { writingMode: "vertical-rl", transform: "rotate(180deg)" }
                  }
                >
                  {brand}
                </span>
              )
            })()}
          </div>

          {/* Menu Items */}
          <div className="flex min-w-0 flex-1 flex-col py-0.5">
            {/* Programs with cascading submenu */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredGroup("__programs__")}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <button
                type="button"
                className="w98-menu-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
                onClick={() =>
                  setHoveredGroup((prev) => (prev === "__programs__" ? null : "__programs__"))
                }
              >
                <Win98Icon kind="folder" size={18} />
                <span className="flex-1 font-medium">{labels.programs}</span>
                <span className="text-[10px]">▶</span>
              </button>

              {hoveredGroup === "__programs__" && (
                <div className="w98-window absolute bottom-0 left-[calc(100%-2px)] flex max-h-[70vh] w-[224px] flex-col overflow-auto p-[3px]">
                  {groupEntries.map(([groupId, group], groupIndex) => (
                    <div key={groupId}>
                      {groupIndex > 0 && (
                        <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      )}
                      <div className="px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#606060] uppercase">
                        {group.label}
                      </div>
                      {group.items.map((app) => (
                        <button
                          key={app.key}
                          type="button"
                          className="w98-menu-item flex w-full items-center gap-2 px-2 py-1 text-left"
                          onClick={() => {
                            onOpenApp(app)
                            onCloseStartMenu()
                          }}
                        >
                          <Win98Icon kind={app.icon} size={16} />
                          <span className="truncate">{app.title}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="w98-menu-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
              onClick={() => {
                onOpenExplorer()
                onCloseStartMenu()
              }}
            >
              <Win98Icon kind="computer" size={18} />
              <span className="truncate">{labels.explorer}</span>
            </button>

            <button
              type="button"
              className="w98-menu-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
              onClick={() => {
                onOpenControlPanel()
                onCloseStartMenu()
              }}
            >
              <Win98Icon kind="settings" size={18} />
              <span className="truncate">{labels.controlPanel}</span>
            </button>

            <button
              type="button"
              className="w98-menu-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
              onClick={() => {
                onOpenDisplayProps()
                onCloseStartMenu()
              }}
            >
              <Win98Icon kind="display" size={18} />
              <span className="truncate">{labels.displayProps}</span>
            </button>

            <button
              type="button"
              className="w98-menu-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
              onClick={() => {
                onOpenAbout()
                onCloseStartMenu()
              }}
            >
              <Win98Icon kind="about" size={18} />
              <span className="truncate">{labels.about}</span>
            </button>

            <div className="my-1 border-t border-[#808080] border-b border-b-white" />

            <button
              type="button"
              className="w98-menu-item flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
              onClick={() => {
                onCloseStartMenu()
                onSwitchDefaultShell()
              }}
            >
              <Win98Icon kind="shutdown" size={18} />
              <span className="truncate">{labels.restoreDefault}</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Taskbar */}
      <footer
        data-win98-taskbar="true"
        className="fixed right-0 bottom-0 left-0 z-[45] flex items-center gap-1 px-1 select-none"
        style={{
          height: TASKBAR_HEIGHT,
          background: "var(--w98-face)",
          borderTop: "2px solid var(--w98-hi)",
          boxShadow: "inset 0 1px 0 var(--w98-light)",
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Start Button */}
        <button
          type="button"
          data-win98-start-btn="true"
          data-active={startMenuOpen ? "true" : "false"}
          className="w98-btn flex h-[24px] shrink-0 items-center gap-1.5 px-2 font-bold"
          onClick={onToggleStartMenu}
        >
          <Win98Icon kind="start" size={16} />
          <span>{labels.start}</span>
        </button>

        {/* Quick Launch Divider */}
        <div className="mx-0.5 h-[22px] w-[2px] border-r border-white border-l border-l-[#808080]" />

        {/* Quick Launch Icons */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="flex h-[24px] w-[24px] items-center justify-center hover:bg-white/40 active:translate-y-px"
            title={labels.showDesktop}
            aria-label={labels.showDesktop}
            onClick={onShowDesktop}
          >
            <Win98Icon kind="desktop" size={16} />
          </button>
          <button
            type="button"
            className="flex h-[24px] w-[24px] items-center justify-center hover:bg-white/40 active:translate-y-px"
            title={labels.explorer}
            aria-label={labels.explorer}
            onClick={onOpenExplorer}
          >
            <Win98Icon kind="computer" size={16} />
          </button>
          <button
            type="button"
            className="flex h-[24px] w-[24px] items-center justify-center hover:bg-white/40 active:translate-y-px"
            title={labels.controlPanel}
            aria-label={labels.controlPanel}
            onClick={onOpenControlPanel}
          >
            <Win98Icon kind="settings" size={16} />
          </button>
          <button
            type="button"
            className="flex h-[24px] w-[24px] items-center justify-center hover:bg-white/40 active:translate-y-px"
            title={labels.displayProps}
            aria-label={labels.displayProps}
            onClick={onOpenDisplayProps}
          >
            <Win98Icon kind="display" size={16} />
          </button>
        </div>

        <div className="mx-0.5 h-[22px] w-[2px] border-r border-white border-l border-l-[#808080]" />

        {/* Open Window Task Buttons */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {windows.map((win) => {
            const isActive = !win.minimized && activeWindowId === win.id
            return (
              <button
                key={win.id}
                type="button"
                data-win98-task-btn={win.id}
                data-active={isActive ? "true" : "false"}
                className={`flex h-[24px] max-w-[170px] min-w-[96px] flex-1 items-center gap-1.5 px-2 text-left text-[12px] ${
                  isActive ? "w98-task-btn-active" : "w98-btn"
                }`}
                onClick={(event) => {
                  onTaskButtonClick(win, event.currentTarget.getBoundingClientRect())
                }}
              >
                <Win98Icon kind={win.icon} size={14} />
                <span className="truncate">{win.title}</span>
              </button>
            )
          })}
        </div>

        {/* Sunken System Tray */}
        <div className="w98-sunken-tray flex h-[24px] shrink-0 items-center gap-1.5 px-2 text-[11px]">
          <span className="flex items-center" title={networkTooltip}>
            <Win98Icon kind={isNetworkBusy ? "network-active" : "network-idle"} size={15} />
          </span>
          {activitySlot}
          {headerActionsSlot}
          <time className="font-mono text-[11px] font-medium tabular-nums" title={dateTitle}>
            {clock}
          </time>
        </div>
      </footer>
    </>
  )
}
