import type { ReactNode } from "react"
import { Check, ChevronRight } from "lucide-react"
import { Ios6AppIcon } from "./ios6-icons"
import type {
  Ios6DesktopMode,
  Ios6ShellState,
  Ios6StatusBarMode,
  Ios6WallpaperId,
} from "./store"

export interface Ios6SwitchProps {
  readonly checked: boolean
  readonly onChange: (next: boolean) => void
  readonly label: string
  readonly testId?: string
}

export function Ios6Switch({ checked, onChange, label, testId }: Ios6SwitchProps): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={() => onChange(!checked)}
      className={`ios6-switch-track relative inline-flex h-[28px] w-[54px] shrink-0 cursor-pointer items-center rounded-full p-[2px] ${
        checked ? "ios6-switch-track-on" : "ios6-switch-track-off"
      }`}
    >
      <span
        className="pointer-events-none absolute left-2 text-[10px] font-bold text-white/95"
        style={{ opacity: checked ? 1 : 0 }}
      >
        ON
      </span>
      <span
        className="pointer-events-none absolute right-1.5 text-[10px] font-bold text-[#6c737c]"
        style={{ opacity: checked ? 0 : 1 }}
      >
        OFF
      </span>
      <span
        className="ios6-switch-thumb block size-[22px] rounded-full"
        style={{
          transform: checked ? "translateX(26px)" : "translateX(0px)",
        }}
      />
    </button>
  )
}

export interface WallpaperOption {
  readonly id: Ios6WallpaperId
  readonly label: string
  readonly previewClass: string
}

export interface Ios6SettingsPanelProps {
  readonly state: Pick<
    Ios6ShellState,
    | "wallpaper"
    | "lockScreenEnabled"
    | "rememberUnlockState"
    | "statusBarMode"
    | "lightThemeContent"
    | "desktopMode"
    | "showBadges"
    | "showSpotlight"
  >
  readonly isDesktopViewport: boolean
  readonly respectSafeArea?: boolean
  readonly includeSafeTopInNavbar?: boolean
  readonly wallpapers: readonly WallpaperOption[]
  readonly onUpdateState: (patch: Partial<Ios6ShellState>) => void
  readonly onOpenLockScreen: () => void
  readonly onOpenSystemSettings: () => void
  readonly onRestoreDefaultShell: () => void
  readonly onClose: () => void
  readonly labels: {
    readonly title: string
    readonly done: string
    readonly sectionLockAndStatus: string
    readonly enableLockScreen: string
    readonly enableLockScreenDesc: string
    readonly rememberUnlock: string
    readonly rememberUnlockDesc: string
    readonly statusBarMode: string
    readonly statusBarModeDesc: string
    readonly statusBarAuto: string
    readonly statusBarAlways: string
    readonly statusBarOff: string
    readonly lockNow: string
    readonly sectionWallpaper: string
    readonly sectionDisplay: string
    readonly desktopMode: string
    readonly desktopModeIpad: string
    readonly desktopModeIphone: string
    readonly lightThemeContent: string
    readonly lightThemeContentDesc: string
    readonly showBadges: string
    readonly showSpotlight: string
    readonly sectionOrahako: string
    readonly openSystemSettings: string
    readonly openSystemSettingsDesc: string
    readonly switchDefaultShell: string
    readonly switchDefaultShellDesc: string
  }
}

export function Ios6SettingsPanel({
  state,
  isDesktopViewport,
  respectSafeArea = true,
  includeSafeTopInNavbar = false,
  wallpapers,
  onUpdateState,
  onOpenLockScreen,
  onOpenSystemSettings,
  onRestoreDefaultShell,
  onClose,
  labels,
}: Ios6SettingsPanelProps): ReactNode {
  const safeBottomPadding = respectSafeArea
    ? "max(28px, calc(20px + var(--ios6-safe-bottom)))"
    : "24px"

  return (
    <div
      className="ios6-pinstripe-bg flex size-full flex-col overflow-hidden"
      data-testid="ios6-settings-panel"
    >
      {/* Classic UINavigationBar */}
      <header
        className="ios6-navbar flex shrink-0 items-center justify-between px-3 py-2"
        style={{
          paddingTop: includeSafeTopInNavbar ? "calc(8px + var(--ios6-safe-top))" : undefined,
          paddingLeft: respectSafeArea ? "max(12px, var(--ios6-safe-left))" : "12px",
          paddingRight: respectSafeArea ? "max(12px, var(--ios6-safe-right))" : "12px",
        }}
      >
        <div className="w-[64px]" />
        <h1 className="ios6-navbar-title truncate text-[18px] font-bold tracking-tight">
          {labels.title}
        </h1>
        <div className="flex w-[64px] justify-end">
          <button
            type="button"
            onClick={onClose}
            className="ios6-nav-btn ios6-nav-btn-primary rounded-[6px] px-3 py-1 text-[12px] font-bold"
            data-testid="ios6-settings-done"
          >
            {labels.done}
          </button>
        </div>
      </header>

      {/* Classic Grouped UITableView */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 pt-4"
        style={{
          paddingLeft: respectSafeArea ? "max(12px, var(--ios6-safe-left))" : "12px",
          paddingRight: respectSafeArea ? "max(12px, var(--ios6-safe-right))" : "12px",
        }}
      >
        <div
          className="mx-auto flex w-full max-w-[540px] flex-col gap-5"
          style={{ paddingBottom: safeBottomPadding }}
        >
          {/* Section 1: Lock Screen & Status Bar */}
          <section>
            <h2 className="ios6-section-header mb-1.5 px-2 text-[13px] font-bold">
              {labels.sectionLockAndStatus}
            </h2>
            <div className="ios6-grouped-card divide-y divide-[#d4d8dd] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#11151c]">
                    {labels.enableLockScreen}
                  </div>
                  <div className="text-[11.5px] text-[#636b78]">
                    {labels.enableLockScreenDesc}
                  </div>
                </div>
                <Ios6Switch
                  checked={state.lockScreenEnabled}
                  onChange={(lockScreenEnabled) => onUpdateState({ lockScreenEnabled })}
                  label={labels.enableLockScreen}
                  testId="ios6-switch-lock-screen"
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#11151c]">
                    {labels.rememberUnlock}
                  </div>
                  <div className="text-[11.5px] text-[#636b78]">{labels.rememberUnlockDesc}</div>
                </div>
                <Ios6Switch
                  checked={state.rememberUnlockState}
                  onChange={(rememberUnlockState) => onUpdateState({ rememberUnlockState })}
                  label={labels.rememberUnlock}
                />
              </div>

              <div className="flex flex-col gap-2 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#11151c]">
                    {labels.statusBarMode}
                  </div>
                  <div className="text-[11.5px] text-[#636b78]">{labels.statusBarModeDesc}</div>
                </div>
                <div className="inline-flex shrink-0 self-start overflow-hidden rounded-[7px] border border-[#969ea8] bg-[#e9ecef] shadow-inner sm:self-center">
                  {(
                    [
                      { id: "auto", label: labels.statusBarAuto },
                      { id: "always", label: labels.statusBarAlways },
                      { id: "off", label: labels.statusBarOff },
                    ] satisfies readonly { readonly id: Ios6StatusBarMode; readonly label: string }[]
                  ).map((opt) => {
                    const active = state.statusBarMode === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateState({ statusBarMode: opt.id })}
                        data-testid={`ios6-status-bar-mode-${opt.id}`}
                        className={`px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                          active
                            ? "bg-[#256ad0] text-white shadow-inner"
                            : "text-[#38404a] hover:bg-white/60"
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenLockScreen}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-[#eef3f8] active:bg-[#dce6f2]"
                data-testid="ios6-lock-now-btn"
              >
                <span className="text-[14px] font-semibold text-[#1e5aa8]">{labels.lockNow}</span>
                <ChevronRight className="size-4 text-[#8c94a0]" />
              </button>
            </div>
          </section>

          {/* Section 2: Wallpaper */}
          <section>
            <h2 className="ios6-section-header mb-1.5 px-2 text-[13px] font-bold">
              {labels.sectionWallpaper}
            </h2>
            <div className="ios6-grouped-card p-3">
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {wallpapers.map((wp) => {
                  const selected = state.wallpaper === wp.id
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => onUpdateState({ wallpaper: wp.id })}
                      data-testid={`ios6-wallpaper-${wp.id}`}
                      className={`group flex flex-col items-center gap-1 rounded-[8px] border p-1.5 transition-all ${
                        selected
                          ? "border-[#1b6bd6] bg-[#e8f1fc] ring-1 ring-[#1b6bd6]"
                          : "border-[#d4d8dd] bg-[#f8f9fa] hover:border-[#99a3b0]"
                      }`}
                    >
                      <div
                        className={`relative h-[54px] w-full overflow-hidden rounded-[5px] border border-black/20 shadow-inner ${wp.previewClass}`}
                      >
                        {selected && (
                          <span className="absolute right-1 bottom-1 flex size-4 items-center justify-center rounded-full bg-[#1b6bd6] text-white shadow">
                            <Check className="size-2.5" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <span className="max-w-full truncate text-[11px] font-medium text-[#222730]">
                        {wp.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Section 3: Display & SpringBoard */}
          <section>
            <h2 className="ios6-section-header mb-1.5 px-2 text-[13px] font-bold">
              {labels.sectionDisplay}
            </h2>
            <div className="ios6-grouped-card divide-y divide-[#d4d8dd] overflow-hidden">
              {isDesktopViewport && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                  <span className="text-[14px] font-semibold text-[#11151c]">
                    {labels.desktopMode}
                  </span>
                  <div className="inline-flex overflow-hidden rounded-[7px] border border-[#969ea8] bg-[#e9ecef] shadow-inner">
                    {(
                      [
                        { id: "ipad", label: labels.desktopModeIpad },
                        { id: "iphone", label: labels.desktopModeIphone },
                      ] satisfies readonly { readonly id: Ios6DesktopMode; readonly label: string }[]
                    ).map((opt) => {
                      const active = state.desktopMode === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onUpdateState({ desktopMode: opt.id })}
                          data-testid={`ios6-desktop-mode-${opt.id}`}
                          className={`px-3 py-1 text-[12px] font-semibold transition-colors ${
                            active
                              ? "bg-[#256ad0] text-white shadow-inner"
                              : "text-[#38404a] hover:bg-white/60"
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#11151c]">
                    {labels.lightThemeContent}
                  </div>
                  <div className="text-[11.5px] text-[#636b78]">
                    {labels.lightThemeContentDesc}
                  </div>
                </div>
                <Ios6Switch
                  checked={state.lightThemeContent}
                  onChange={(lightThemeContent) => onUpdateState({ lightThemeContent })}
                  label={labels.lightThemeContent}
                  testId="ios6-switch-light-content"
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="text-[14px] font-semibold text-[#11151c]">
                  {labels.showBadges}
                </span>
                <Ios6Switch
                  checked={state.showBadges}
                  onChange={(showBadges) => onUpdateState({ showBadges })}
                  label={labels.showBadges}
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="text-[14px] font-semibold text-[#11151c]">
                  {labels.showSpotlight}
                </span>
                <Ios6Switch
                  checked={state.showSpotlight}
                  onChange={(showSpotlight) => onUpdateState({ showSpotlight })}
                  label={labels.showSpotlight}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Orahako & Exit Shell */}
          <section>
            <h2 className="ios6-section-header mb-1.5 px-2 text-[13px] font-bold">
              {labels.sectionOrahako}
            </h2>
            <div className="ios6-grouped-card divide-y divide-[#d4d8dd] overflow-hidden">
              <button
                type="button"
                onClick={onOpenSystemSettings}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#eef3f8] active:bg-[#dce6f2]"
                data-testid="ios6-open-system-settings"
              >
                <Ios6AppIcon kind="settings" size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#11151c]">
                    {labels.openSystemSettings}
                  </div>
                  <div className="text-[11.5px] text-[#636b78]">
                    {labels.openSystemSettingsDesc}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-[#8c94a0]" />
              </button>

              <button
                type="button"
                onClick={onRestoreDefaultShell}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[#fdf1f0] active:bg-[#fae2e0]"
                data-testid="ios6-restore-default-shell"
              >
                <Ios6AppIcon kind="power" size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#c5241b]">
                    {labels.switchDefaultShell}
                  </div>
                  <div className="text-[11.5px] text-[#636b78]">
                    {labels.switchDefaultShellDesc}
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-[#8c94a0]" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
