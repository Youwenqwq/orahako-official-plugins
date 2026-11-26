import { useState, type ReactNode } from "react"
import type { Win98SchemeId, Win98WallpaperId } from "./store"
import { Win98Icon, type Win98IconKind } from "./win98-icons"
import { WIN98_SCHEMES, WIN98_WALLPAPERS } from "./win98-styles"

export interface DesktopAppEntry {
  readonly key: string
  readonly pluginId: string
  readonly pageId: string
  readonly title: string
  readonly group: string
  readonly groupLabel: string
  readonly icon: Win98IconKind
  readonly primary: boolean
}

export interface ExplorerWindowContentProps {
  readonly apps: readonly DesktopAppEntry[]
  readonly viewMode: "icons" | "list"
  readonly onViewModeChange: (mode: "icons" | "list") => void
  readonly onOpenApp: (app: DesktopAppEntry) => void
  readonly labels: {
    readonly address: string
    readonly allApps: string
    readonly viewIcons: string
    readonly viewList: string
    readonly objectsCount: (count: number) => string
    readonly emptyDesktop: string
  }
}

export function ExplorerWindowContent({
  apps,
  viewMode,
  onViewModeChange,
  onOpenApp,
  labels,
}: ExplorerWindowContentProps): ReactNode {
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const groups: { readonly id: string; readonly label: string }[] = []
  const seen = new Set<string>()
  for (const app of apps) {
    if (!seen.has(app.group)) {
      seen.add(app.group)
      groups.push({ id: app.group, label: app.groupLabel })
    }
  }

  const visibleApps =
    selectedGroup === "all" ? apps : apps.filter((app) => app.group === selectedGroup)

  const activeGroupLabel =
    selectedGroup === "all"
      ? labels.allApps
      : (groups.find((g) => g.id === selectedGroup)?.label ?? selectedGroup)

  return (
    <div className="flex h-full flex-col bg-[#c0c0c0] text-[12px] text-black select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-[#808080] px-2 py-1.5">
        <span className="text-[11px] text-[#404040]">{labels.address}:</span>
        <div className="w98-sunken flex h-[22px] min-w-0 flex-1 items-center gap-1.5 px-1.5 text-[12px]">
          <Win98Icon kind="folder-open" size={14} />
          <span className="truncate font-mono text-[11px]">
            C:\Orahako\{selectedGroup === "all" ? "Apps" : activeGroupLabel}
          </span>
        </div>
        <button
          type="button"
          className="w98-btn h-[22px] px-2 text-[11px]"
          data-active={viewMode === "icons" ? "true" : "false"}
          onClick={() => onViewModeChange("icons")}
        >
          {labels.viewIcons}
        </button>
        <button
          type="button"
          className="w98-btn h-[22px] px-2 text-[11px]"
          data-active={viewMode === "list" ? "true" : "false"}
          onClick={() => onViewModeChange("list")}
        >
          {labels.viewList}
        </button>
      </div>

      {/* Split Pane: Folder Tree + File Grid */}
      <div className="flex min-h-0 flex-1 gap-[3px] p-[3px]">
        <aside className="w98-sunken flex w-[148px] shrink-0 flex-col overflow-auto bg-white p-1">
          <button
            type="button"
            className="flex items-center gap-1.5 px-1.5 py-1 text-left text-[12px]"
            style={
              selectedGroup === "all"
                ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                : undefined
            }
            onClick={() => setSelectedGroup("all")}
          >
            <Win98Icon kind="computer" size={14} />
            <span className="truncate">{labels.allApps}</span>
          </button>
          {groups.map((group) => {
            const active = selectedGroup === group.id
            return (
              <button
                key={group.id}
                type="button"
                className="flex items-center gap-1.5 py-1 pr-1.5 pl-4 text-left text-[12px]"
                style={
                  active
                    ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                    : undefined
                }
                onClick={() => setSelectedGroup(group.id)}
              >
                <Win98Icon kind={active ? "folder-open" : "folder"} size={14} />
                <span className="truncate">{group.label}</span>
              </button>
            )
          })}
        </aside>

        <div
          className="w98-sunken min-w-0 flex-1 overflow-auto bg-white p-2.5"
          onClick={() => setSelectedKey(null)}
        >
          {visibleApps.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[#606060]">
              {labels.emptyDesktop}
            </div>
          ) : viewMode === "icons" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
              {visibleApps.map((app) => {
                const selected = selectedKey === app.key
                return (
                  <button
                    key={app.key}
                    type="button"
                    className="flex flex-col items-center gap-1.5 p-1.5 text-center"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedKey(app.key)
                    }}
                    onDoubleClick={(event) => {
                      event.stopPropagation()
                      onOpenApp(app)
                    }}
                  >
                    <Win98Icon kind={app.icon} size={32} />
                    <span
                      className="line-clamp-2 max-w-[80px] px-1 text-[11px] leading-tight break-words"
                      style={
                        selected
                          ? {
                              background: "var(--w98-accent)",
                              color: "var(--w98-accent-fg)",
                              outline: "1px dotted #ffff00",
                            }
                          : undefined
                      }
                    >
                      {app.title}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="bg-[#c0c0c0]">
                  <th className="w98-raised px-2 py-1 font-normal">Name</th>
                  <th className="w98-raised px-2 py-1 font-normal">Group</th>
                  <th className="w98-raised px-2 py-1 font-normal">Plugin ID</th>
                </tr>
              </thead>
              <tbody>
                {visibleApps.map((app) => {
                  const selected = selectedKey === app.key
                  return (
                    <tr
                      key={app.key}
                      className="cursor-pointer"
                      style={
                        selected
                          ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                          : undefined
                      }
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedKey(app.key)
                      }}
                      onDoubleClick={(event) => {
                        event.stopPropagation()
                        onOpenApp(app)
                      }}
                    >
                      <td className="flex items-center gap-1.5 px-2 py-1">
                        <Win98Icon kind={app.icon} size={15} />
                        <span className="truncate">{app.title}</span>
                      </td>
                      <td className="px-2 py-1">{app.groupLabel}</td>
                      <td className="px-2 py-1 font-mono text-[11px] opacity-80">{app.pluginId}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer count */}
      <div className="border-t border-[#ffffff] px-2 py-1 text-[11px] text-[#404040]">
        {labels.objectsCount(visibleApps.length)}
      </div>
    </div>
  )
}

export interface DisplayPropertiesContentProps {
  readonly wallpaper: Win98WallpaperId
  readonly scheme: Win98SchemeId
  readonly onWallpaperChange: (wallpaper: Win98WallpaperId) => void
  readonly onSchemeChange: (scheme: Win98SchemeId) => void
  readonly onClose: () => void
  readonly labels: {
    readonly tabBackground: string
    readonly tabAppearance: string
    readonly wallpaperLabel: string
    readonly schemeLabel: string
    readonly wallpapers: Readonly<Record<Win98WallpaperId, string>>
    readonly schemes: Readonly<Record<Win98SchemeId, string>>
    readonly applyHint: string
    readonly ok: string
  }
}

const WALLPAPER_IDS: readonly Win98WallpaperId[] = ["teal", "clouds", "grid", "ocean", "forest"]
const SCHEME_IDS: readonly Win98SchemeId[] = ["standard", "rainy", "rose", "spruce", "plum"]

export function DisplayPropertiesContent({
  wallpaper,
  scheme,
  onWallpaperChange,
  onSchemeChange,
  onClose,
  labels,
}: DisplayPropertiesContentProps): ReactNode {
  const [tab, setTab] = useState<"background" | "appearance">("background")
  const previewScheme = WIN98_SCHEMES[scheme]
  const previewWallpaper = WIN98_WALLPAPERS[wallpaper]

  return (
    <div className="flex h-full flex-col bg-[#c0c0c0] p-3 text-[12px] text-black select-none">
      {/* Win98 Tab Strip */}
      <div className="flex items-end gap-[2px] pl-1">
        <button
          type="button"
          className="w98-raised px-3 py-1 text-[12px]"
          style={{
            marginBottom: tab === "background" ? -2 : 0,
            paddingBottom: tab === "background" ? 6 : 4,
            zIndex: tab === "background" ? 2 : 1,
          }}
          onClick={() => setTab("background")}
        >
          {labels.tabBackground}
        </button>
        <button
          type="button"
          className="w98-raised px-3 py-1 text-[12px]"
          style={{
            marginBottom: tab === "appearance" ? -2 : 0,
            paddingBottom: tab === "appearance" ? 6 : 4,
            zIndex: tab === "appearance" ? 2 : 1,
          }}
          onClick={() => setTab("appearance")}
        >
          {labels.tabAppearance}
        </button>
      </div>

      {/* Tab Panel */}
      <div className="w98-raised flex min-h-0 flex-1 flex-col gap-3 p-3">
        {/* Iconic Miniature CRT Monitor Preview */}
        <div className="flex flex-col items-center py-1">
          <div className="w98-raised rounded-none p-2" style={{ width: 196, background: "#c8c8c0" }}>
            <div
              className="w98-sunken relative overflow-hidden"
              style={{
                width: "100%",
                height: 112,
                background: previewWallpaper,
              }}
            >
              {/* Miniature Inactive Window */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 12,
                  width: 110,
                  height: 64,
                  background: previewScheme.face,
                  border: `1px solid ${previewScheme.darkShadow}`,
                  boxShadow: `inset 1px 1px 0 ${previewScheme.highlight}`,
                  padding: 2,
                }}
              >
                <div
                  style={{
                    height: 11,
                    background: `linear-gradient(90deg, ${previewScheme.titleInactiveA}, ${previewScheme.titleInactiveB})`,
                    color: previewScheme.titleInactiveText,
                    fontSize: 7,
                    lineHeight: "11px",
                    paddingLeft: 3,
                  }}
                >
                  Inactive
                </div>
              </div>
              {/* Miniature Active Window */}
              <div
                style={{
                  position: "absolute",
                  top: 26,
                  left: 38,
                  width: 122,
                  height: 68,
                  background: previewScheme.face,
                  border: `1px solid ${previewScheme.darkShadow}`,
                  boxShadow: `inset 1px 1px 0 ${previewScheme.highlight}`,
                  padding: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: 12,
                    background: `linear-gradient(90deg, ${previewScheme.titleActiveA}, ${previewScheme.titleActiveB})`,
                    color: previewScheme.titleActiveText,
                    fontSize: 7,
                    fontWeight: 700,
                    lineHeight: "12px",
                    paddingLeft: 3,
                  }}
                >
                  Orahako 98
                </div>
                <div
                  style={{
                    flex: 1,
                    marginTop: 2,
                    background: "#ffffff",
                    border: `1px inset ${previewScheme.shadow}`,
                    padding: 4,
                    fontSize: 7,
                    color: "#000000",
                  }}
                >
                  Window Text
                </div>
              </div>
              {/* Miniature Taskbar */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 12,
                  background: previewScheme.face,
                  borderTop: `1px solid ${previewScheme.highlight}`,
                }}
              />
            </div>
          </div>
          {/* Monitor Stand */}
          <div className="h-[10px] w-[42px] bg-[#808080]" />
          <div className="w98-raised h-[10px] w-[96px]" />
        </div>

        {/* Selector List */}
        {tab === "background" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="text-[12px] font-bold">{labels.wallpaperLabel}</label>
            <div className="w98-sunken flex-1 overflow-auto bg-white p-1">
              {WALLPAPER_IDS.map((id) => {
                const selected = wallpaper === id
                return (
                  <button
                    key={id}
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1 text-left text-[12px]"
                    style={
                      selected
                        ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                        : undefined
                    }
                    onClick={() => onWallpaperChange(id)}
                  >
                    <span
                      className="inline-block h-[12px] w-[18px] shrink-0 border border-black"
                      style={{ background: WIN98_WALLPAPERS[id] }}
                    />
                    <span>{labels.wallpapers[id]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="text-[12px] font-bold">{labels.schemeLabel}</label>
            <div className="w98-sunken flex-1 overflow-auto bg-white p-1">
              {SCHEME_IDS.map((id) => {
                const selected = scheme === id
                const token = WIN98_SCHEMES[id]
                return (
                  <button
                    key={id}
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1 text-left text-[12px]"
                    style={
                      selected
                        ? { background: "var(--w98-accent)", color: "var(--w98-accent-fg)" }
                        : undefined
                    }
                    onClick={() => onSchemeChange(id)}
                  >
                    <span
                      className="inline-block h-[12px] w-[18px] shrink-0 border border-black"
                      style={{
                        background: `linear-gradient(90deg, ${token.titleActiveA}, ${token.titleActiveB})`,
                      }}
                    />
                    <span>{labels.schemes[id]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#404040]">{labels.applyHint}</p>
      </div>

      {/* Footer Buttons */}
      <div className="mt-2.5 flex justify-end gap-2">
        <button type="button" className="w98-btn h-[24px] min-w-[74px] px-3" onClick={onClose}>
          {labels.ok}
        </button>
      </div>
    </div>
  )
}

export interface AboutWin98ContentProps {
  readonly brand: string
  readonly versionLine: string
  readonly desc: string
  readonly pluginsLoadedText: string
  readonly switchDefaultLabel: string
  readonly okLabel: string
  readonly onSwitchDefault: () => void
  readonly onClose: () => void
}

export function AboutWin98Content({
  brand,
  versionLine,
  desc,
  pluginsLoadedText,
  switchDefaultLabel,
  okLabel,
  onSwitchDefault,
  onClose,
}: AboutWin98ContentProps): ReactNode {
  return (
    <div className="flex h-full flex-col bg-[#c0c0c0] text-[12px] text-black select-none">
      {/* Classic Win98 Banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 text-white"
        style={{
          background: "linear-gradient(90deg, var(--w98-title-a) 0%, var(--w98-title-b) 100%)",
        }}
      >
        <Win98Icon kind="start" size={32} />
        <div>
          <div className="text-[16px] font-bold tracking-wide">{brand}</div>
          <div className="text-[11px] opacity-90">{versionLine}</div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="leading-relaxed">{desc}</p>
        <div className="w98-sunken-tray px-2.5 py-1.5 text-[11px] text-[#303030]">
          {pluginsLoadedText}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <button
            type="button"
            className="w98-btn flex h-[24px] items-center gap-1.5 px-2.5"
            onClick={onSwitchDefault}
          >
            <Win98Icon kind="shutdown" size={14} />
            <span>{switchDefaultLabel}</span>
          </button>
          <button type="button" className="w98-btn h-[24px] min-w-[74px] px-3" onClick={onClose}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export interface ControlPanelItem {
  readonly id: string
  readonly kind: "display" | "system-settings" | "category"
  readonly categoryId?: string
  readonly pluginId?: string
  readonly title: string
  readonly description?: string
  readonly icon: Win98IconKind
}

export interface ControlPanelContentProps {
  readonly items: readonly ControlPanelItem[]
  readonly onOpenItem: (item: ControlPanelItem) => void
  readonly labels: {
    readonly title: string
    readonly address: string
    readonly defaultDesc: string
    readonly objectsCount: (count: number) => string
  }
}

export function ControlPanelContent({
  items,
  onOpenItem,
  labels,
}: ControlPanelContentProps): ReactNode {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedItem = items.find((item) => item.id === selectedId) ?? null

  return (
    <div className="flex h-full flex-col bg-[#c0c0c0] text-[12px] text-black select-none">
      {/* Address Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#808080] px-2 py-1.5">
        <span className="text-[11px] text-[#404040]">{labels.address}:</span>
        <div className="w98-sunken flex h-[22px] min-w-0 flex-1 items-center gap-1.5 px-1.5 text-[12px]">
          <Win98Icon kind="settings" size={14} />
          <span className="truncate font-mono text-[11px]">C:\Orahako\Control Panel</span>
        </div>
      </div>

      {/* Authentic Windows 98 SE Web-View Split: Left Info Panel + Right Applet Grid */}
      <div className="flex min-h-0 flex-1 gap-[3px] p-[3px]">
        <aside className="w98-sunken flex w-[176px] shrink-0 flex-col overflow-auto bg-white">
          <div
            className="h-[4px] w-full shrink-0"
            style={{
              background: "linear-gradient(90deg, var(--w98-title-a) 0%, var(--w98-title-b) 100%)",
            }}
          />
          <div className="flex flex-col gap-2 p-3">
            <Win98Icon kind={selectedItem?.icon ?? "settings"} size={32} />
            <div className="text-[13px] font-bold leading-snug">
              {selectedItem?.title ?? labels.title}
            </div>
            <div className="h-px bg-[#c0c0c0]" />
            <p className="text-[11px] leading-relaxed text-[#404040]">
              {selectedItem?.description || labels.defaultDesc}
            </p>
            {selectedItem?.pluginId && (
              <div className="mt-1 font-mono text-[10px] text-[#707070]">
                {selectedItem.pluginId}
              </div>
            )}
          </div>
        </aside>

        <div
          className="w98-sunken min-w-0 flex-1 overflow-auto bg-white p-3"
          onClick={() => setSelectedId(null)}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2.5">
            {items.map((item) => {
              const selected = selectedId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex flex-col items-center gap-1.5 p-1.5 text-center"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedId(item.id)
                  }}
                  onDoubleClick={(event) => {
                    event.stopPropagation()
                    onOpenItem(item)
                  }}
                >
                  <Win98Icon kind={item.icon} size={32} />
                  <span
                    className="line-clamp-2 max-w-[84px] px-1 text-[11px] leading-tight break-words"
                    style={
                      selected
                        ? {
                            background: "var(--w98-accent)",
                            color: "var(--w98-accent-fg)",
                            outline: "1px dotted #ffff00",
                          }
                        : undefined
                    }
                  >
                    {item.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer count */}
      <div className="border-t border-[#ffffff] px-2 py-1 text-[11px] text-[#404040]">
        {labels.objectsCount(items.length)}
      </div>
    </div>
  )
}
