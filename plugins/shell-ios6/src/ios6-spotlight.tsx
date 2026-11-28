import { useMemo, type ReactNode } from "react"
import { ChevronRight, Search, X } from "lucide-react"
import { Ios6AppIcon } from "./ios6-icons"
import {
  filterSpotlightResults,
  type SpringBoardAppEntry,
  type SpringBoardSettingsEntry,
} from "./springboard"

export interface Ios6SpotlightProps {
  readonly open: boolean
  readonly query: string
  readonly onQueryChange: (next: string) => void
  readonly onClose: () => void
  readonly apps: readonly SpringBoardAppEntry[]
  readonly settingsEntries: readonly SpringBoardSettingsEntry[]
  readonly onSelectApp: (app: SpringBoardAppEntry) => void
  readonly onSelectSetting: (entry: SpringBoardSettingsEntry) => void
  readonly labels: {
    readonly placeholder: string
    readonly appsHeader: string
    readonly settingsHeader: string
    readonly empty: string
    readonly cancel: string
  }
}

export function Ios6Spotlight({
  open,
  query,
  onQueryChange,
  onClose,
  apps,
  settingsEntries,
  onSelectApp,
  onSelectSetting,
  labels,
}: Ios6SpotlightProps): ReactNode {
  const results = useMemo(
    () => filterSpotlightResults(apps, settingsEntries, query),
    [apps, query, settingsEntries]
  )

  if (!open) return null

  const hasResults = results.apps.length > 0 || results.settings.length > 0

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-black/78 backdrop-blur-sm"
      style={{
        paddingTop: "max(28px, calc(22px + var(--ios6-safe-top)))",
        paddingBottom: "var(--ios6-safe-bottom)",
      }}
      data-testid="ios6-spotlight"
    >
      {/* Classic Glossy Search Bar */}
      <div
        className="flex shrink-0 items-center gap-2 border-b border-black/80 px-3 py-2.5"
        style={{
          background: "linear-gradient(180deg, #5a6069 0%, #3a3e45 50%, #2b2e33 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        <div className="relative flex flex-1 items-center rounded-full border border-black/60 bg-white px-3 py-1.5 shadow-inner">
          <Search className="mr-2 size-4 shrink-0 text-neutral-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={labels.placeholder}
            autoFocus
            className="w-full bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="ml-1 rounded-full bg-neutral-400/70 p-0.5 text-white hover:bg-neutral-500"
              aria-label="Clear"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ios6-nav-btn shrink-0 rounded-[6px] px-3 py-1.5 text-[12px] font-semibold"
        >
          {labels.cancel}
        </button>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!hasResults ? (
          <div className="py-12 text-center text-[13px] text-white/60">{labels.empty}</div>
        ) : (
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3">
            {results.apps.length > 0 && (
              <section className="overflow-hidden rounded-[10px] border border-white/15 bg-[#1b1f25]/92 shadow-lg">
                <div className="border-b border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-wider text-white/60 uppercase">
                  {labels.appsHeader}
                </div>
                <div className="divide-y divide-white/10">
                  {results.apps.map((app: SpringBoardAppEntry) => (
                    <button
                      key={app.key}
                      type="button"
                      onClick={() => {
                        onSelectApp(app)
                        onClose()
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/10 active:bg-white/15"
                    >
                      <Ios6AppIcon
                        kind={app.icon}
                        size={36}
                        badgeCount={app.badgeCount}
                        badgeComponent={app.badgeComponent}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-white">
                          {app.title}
                        </div>
                        <div className="truncate text-[11px] text-white/55">{app.groupLabel}</div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-white/40" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.settings.length > 0 && (
              <section className="overflow-hidden rounded-[10px] border border-white/15 bg-[#1b1f25]/92 shadow-lg">
                <div className="border-b border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold tracking-wider text-white/60 uppercase">
                  {labels.settingsHeader}
                </div>
                <div className="divide-y divide-white/10">
                  {results.settings.map((entry: SpringBoardSettingsEntry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        onSelectSetting(entry)
                        onClose()
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/10 active:bg-white/15"
                    >
                      <Ios6AppIcon kind={entry.icon} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold text-white">
                          {entry.title}
                        </div>
                        {entry.description && (
                          <div className="truncate text-[11px] text-white/55">
                            {entry.description}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-white/40" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
