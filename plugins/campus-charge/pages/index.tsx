import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  KeyRound,
  RefreshCw,
  Square,
  Star,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import type {
  DerivedComponentProps,
  ObservableSource,
  SlotComponent,
} from "@orahako/sdk"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from "@orahako/ui-primitives"
import type { CampusChargeClient } from "../client"
import {
  CHARGE_DEVICES,
  MIN_QUERY_INTERVAL_MS,
  RATE_LIMIT_COOLDOWN_MS,
  READING_TTL_MS,
} from "../devices"
import type { CampusChargeDictionary } from "../i18n"
import type { ChargeDataStoreInstance } from "../store"
import {
  ChargeClientError,
  countUsableFreePorts,
  isPortFree,
  isReadingFresh,
  type PortNote,
  type PortUsability,
} from "../types"

type FilterTab = "all" | "free" | "favorite"

interface EditingPort {
  readonly code: string
  readonly name: string
  readonly port: string
}

export interface ChargeIndexInject {
  readonly hooks: {
    readonly authHydrated: ObservableSource<boolean>
    readonly dataHydrated: ObservableSource<boolean>
    readonly hasToken: ObservableSource<boolean>
  }
  readonly getClient: () => CampusChargeClient | null
  readonly openSettings: () => void
}

export type ChargeIndexPageProps = DerivedComponentProps<
  Record<string, never>,
  CampusChargeDictionary,
  undefined,
  ChargeDataStoreInstance,
  ChargeIndexInject
>

const DEFAULT_PORTS = Array.from({ length: 10 }, (_, index) => ({
  number: String(index + 1),
  status: "unknown",
}))

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour12: false,
  })
}

export const ChargeIndexPage: SlotComponent<ChargeIndexPageProps> = (props) => {
  const { t, useStore, actions, useAuthHydrated, useDataHydrated, useHasToken, getClient, openSettings } =
    props

  const favorites = useStore((state) => state.favorites)
  const notes = useStore((state) => state.notes)
  const readings = useStore((state) => state.readings)
  const cooldownUntil = useStore((state) => state.cooldownUntil)
  const authHydrated = useAuthHydrated()
  const dataHydrated = useDataHydrated()
  const hasToken = useHasToken()

  const [filter, setFilter] = useState<FilterTab>("all")
  const [now, setNow] = useState(() => Date.now())
  const [loadingCode, setLoadingCode] = useState<string | null>(null)
  const [deviceErrors, setDeviceErrors] = useState<Record<string, string>>({})
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{
    name: string
    current: number
    total: number
  } | null>(null)
  const [loginExpired, setLoginExpired] = useState(false)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)

  const [editing, setEditing] = useState<EditingPort | null>(null)
  const [noteUsability, setNoteUsability] = useState<PortUsability>("unknown")
  const [noteText, setNoteText] = useState("")

  const cancelRef = useRef(false)
  const lastUpstreamAtRef = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (hasToken) {
      setLoginExpired(false)
    }
  }, [hasToken])

  useEffect(() => {
    return () => {
      cancelRef.current = true
    }
  }, [])

  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  const summary = useMemo(() => {
    let confirmedCount = 0
    let freePortsTotal = 0
    let freeDevicesTotal = 0
    for (const device of CHARGE_DEVICES) {
      const reading = readings[device.code]
      if (!isReadingFresh(reading, now, READING_TTL_MS) || deviceErrors[device.code]) continue
      confirmedCount += 1
      const freeCount = countUsableFreePorts(reading, notes)
      if (freeCount > 0) {
        freePortsTotal += freeCount
        freeDevicesTotal += 1
      }
    }
    return { confirmedCount, freePortsTotal, freeDevicesTotal }
  }, [readings, notes, now, deviceErrors])

  const filteredDevices = useMemo(() => {
    if (filter === "favorite") {
      return CHARGE_DEVICES.filter((device) => favorites.includes(device.code))
    }
    if (filter === "free") {
      return CHARGE_DEVICES.filter((device) => {
        const reading = readings[device.code]
        return (
          isReadingFresh(reading, now, READING_TTL_MS) &&
          !deviceErrors[device.code] &&
          countUsableFreePorts(reading, notes) > 0
        )
      })
    }
    return CHARGE_DEVICES
  }, [filter, favorites, readings, notes, now, deviceErrors])

  function openNoteEditor(device: { code: string; name: string }, port: string) {
    const existing = notes[`${device.code}:${port}`]
    setEditing({ code: device.code, name: device.name, port })
    setNoteUsability(existing?.usability ?? "unknown")
    setNoteText(existing?.note ?? "")
  }

  function handleSaveNote() {
    if (!editing) return
    actions.savePortNote({
      code: editing.code,
      port: editing.port,
      usability: noteUsability,
      note: noteText,
    })
    toast.success(t("charge.saved"))
    setEditing(null)
  }

  async function queryCodes(codes: readonly string[]) {
    if (batchRunning || codes.length === 0) return
    const client = getClient()
    if (!client) {
      toast.error(t("charge.noTokenBanner"))
      openSettings()
      return
    }
    if (cooldownUntil > Date.now()) {
      return
    }

    cancelRef.current = false
    setBatchRunning(true)
    setBannerMessage(null)
    setLoginExpired(false)

    try {
      for (let index = 0; index < codes.length; index += 1) {
        if (cancelRef.current) break
        const code = codes[index]
        const device = CHARGE_DEVICES.find((item) => item.code === code)
        const existing = readings[code]

        if (isReadingFresh(existing, Date.now(), READING_TTL_MS)) {
          setDeviceErrors((prev) => {
            if (!prev[code]) return prev
            const next = { ...prev }
            delete next[code]
            return next
          })
          continue
        }

        const sinceLast = Date.now() - lastUpstreamAtRef.current
        if (lastUpstreamAtRef.current > 0 && sinceLast < MIN_QUERY_INTERVAL_MS) {
          await sleep(MIN_QUERY_INTERVAL_MS - sinceLast)
        }
        if (cancelRef.current) break

        setLoadingCode(code)
        if (codes.length > 1 && device) {
          setBatchProgress({ name: device.name, current: index + 1, total: codes.length })
        }

        try {
          lastUpstreamAtRef.current = Date.now()
          const reading = await client.queryDevice(code)
          actions.saveReading(reading)
          setDeviceErrors((prev) => {
            if (!prev[code]) return prev
            const next = { ...prev }
            delete next[code]
            return next
          })
        } catch (error) {
          if (error instanceof ChargeClientError) {
            if (error.code === "login_expired") {
              setLoginExpired(true)
              setBannerMessage(error.message)
              toast.error(error.message)
              break
            }
            if (error.code === "upstream_limited") {
              const until = Date.now() + (error.retryAfterMs ?? RATE_LIMIT_COOLDOWN_MS)
              actions.setCooldownUntil(until)
              setBannerMessage(error.message)
              toast.error(error.message)
              break
            }
            setDeviceErrors((prev) => ({ ...prev, [code]: error.message }))
          } else {
            setDeviceErrors((prev) => ({
              ...prev,
              [code]: error instanceof Error ? error.message : String(error),
            }))
          }
        } finally {
          setLoadingCode(null)
        }
      }
    } finally {
      setBatchRunning(false)
      setBatchProgress(null)
      setLoadingCode(null)
    }
  }

  function handleStop() {
    cancelRef.current = true
  }

  const ready = authHydrated && dataHydrated
  const canQuery = ready && hasToken && cooldownSeconds === 0 && !batchRunning

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="size-5 text-emerald-600 dark:text-emerald-400" />
              {t("charge.title")}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{t("charge.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {batchRunning ? (
              <Button type="button" variant="destructive" size="sm" onClick={handleStop}>
                <Square className="mr-1.5 size-3.5" />
                {t("charge.stopQuery")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canQuery}
                  onClick={() => void queryCodes(CHARGE_DEVICES.map((device) => device.code))}
                >
                  <RefreshCw className="mr-1.5 size-3.5" />
                  {t("charge.queryAll")}
                </Button>
                {favorites.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canQuery}
                    onClick={() => void queryCodes(favorites)}
                  >
                    <Star className="mr-1.5 size-3.5" />
                    {t("charge.queryFavorites")}
                  </Button>
                )}
              </>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => openSettings()}>
              <KeyRound className="mr-1.5 size-3.5" />
              {t("charge.goSettings")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="text-2xl font-semibold tabular-nums">
                {summary.confirmedCount > 0 ? summary.freePortsTotal : "—"}
              </div>
              <div className="text-xs text-muted-foreground">{t("charge.statFreePorts")}</div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="text-2xl font-semibold tabular-nums">
                {summary.confirmedCount > 0 ? summary.freeDevicesTotal : "—"}
              </div>
              <div className="text-xs text-muted-foreground">{t("charge.statFreeDevices")}</div>
            </div>
            <div className="col-span-2 flex flex-col justify-center rounded-lg border bg-muted/40 p-3 sm:col-span-1">
              <div className="text-sm font-medium">
                {t("charge.statConfirmed", {
                  confirmed: summary.confirmedCount,
                  total: CHARGE_DEVICES.length,
                })}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t("charge.statFreshHint")}
              </div>
            </div>
          </div>
          {batchProgress && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
              <RefreshCw className="size-3.5 animate-spin" />
              <span>{t("charge.queryProgress", batchProgress)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {ready && !hasToken && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{t("charge.noTokenBanner")}</span>
          </div>
          <Button type="button" size="sm" onClick={() => openSettings()}>
            {t("charge.goSettings")}
          </Button>
        </div>
      )}

      {loginExpired && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{t("charge.loginExpiredBanner")}</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => openSettings()}>
            {t("charge.goSettings")}
          </Button>
        </div>
      )}

      {cooldownSeconds > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          {t("charge.cooldownBanner", { seconds: cooldownSeconds })}
        </div>
      )}

      {bannerMessage && !loginExpired && cooldownSeconds === 0 && (
        <div className="rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {bannerMessage}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">{t("charge.devicesHeading")}</h2>
          <p className="text-xs text-muted-foreground">{t("charge.devicesHint")}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(
            [
              ["all", t("charge.filterAll")],
              ["free", t("charge.filterFree")],
              ["favorite", t("charge.filterFavorite")],
            ] as const
          ).map(([tab, label]) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={filter === tab ? "default" : "outline"}
              onClick={() => setFilter(tab)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {filter === "favorite" ? t("charge.emptyFavorites") : t("charge.emptyFree")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => {
            const reading = readings[device.code]
            const error = deviceErrors[device.code]
            const isLoading = loadingCode === device.code
            const fresh = isReadingFresh(reading, now, READING_TTL_MS) && !error
            const freeCount = countUsableFreePorts(reading, notes)
            const isFavorite = favorites.includes(device.code)
            const ports = reading?.ports ?? DEFAULT_PORTS

            const statusLabel = isLoading
              ? t("charge.statusQuerying")
              : error
                ? t("charge.statusFailed")
                : reading
                  ? fresh
                    ? reading.online
                      ? freeCount > 0
                        ? t("charge.statusFreeCount", { count: freeCount })
                        : t("charge.statusNoFree")
                      : t("charge.statusOffline")
                    : t("charge.statusStale")
                  : t("charge.statusNever")

            const deviceNotes: PortNote[] = Object.values(notes).filter(
              (item) =>
                item.code === device.code && (item.note.length > 0 || item.usability !== "unknown")
            )

            return (
              <Card
                key={device.code}
                className={
                  fresh && freeCount > 0
                    ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                    : undefined
                }
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{device.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {device.code}
                        </span>
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant={fresh && freeCount > 0 ? "default" : "secondary"}
                          className={
                            fresh && freeCount > 0
                              ? "bg-emerald-600 text-white hover:bg-emerald-600"
                              : undefined
                          }
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={device.name}
                      onClick={() => actions.toggleFavorite(device.code)}
                    >
                      <Star
                        className={
                          isFavorite
                            ? "size-4 fill-amber-400 text-amber-500"
                            : "size-4 text-muted-foreground"
                        }
                      />
                    </Button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {ports.map((port) => {
                      const note = notes[`${device.code}:${port.number}`]
                      const isFree = fresh && reading?.online && isPortFree(port.status)
                      const isBusy = fresh && reading?.online && port.status === "busy"

                      const toneClass = isFree
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                        : isBusy
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-200"
                          : "border-border bg-muted/50 text-muted-foreground"

                      const markClass =
                        note?.usability === "bad"
                          ? "ring-1 ring-destructive/60"
                          : note?.usability === "good"
                            ? "ring-1 ring-emerald-500/60"
                            : ""

                      const portStatusText =
                        fresh && reading?.online
                          ? isFree
                            ? t("charge.portIdle")
                            : isBusy
                              ? t("charge.portBusy")
                              : t("charge.portUnavailable")
                          : t("charge.portUnconfirmed")

                      return (
                        <button
                          key={port.number}
                          type="button"
                          onClick={() => openNoteEditor(device, port.number)}
                          title={`${port.number}号：${portStatusText}${note?.note ? ` · ${note.note}` : ""}`}
                          className={`relative flex h-9 items-center justify-center rounded-md border text-xs font-medium transition hover:opacity-85 ${toneClass} ${markClass}`}
                        >
                          <span>{port.number}</span>
                          {note?.usability === "bad" && (
                            <span className="absolute top-0.5 right-1 text-[10px] font-bold text-destructive">
                              ×
                            </span>
                          )}
                          {note?.usability === "good" && (
                            <span className="absolute top-0.5 right-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              ✓
                            </span>
                          )}
                          {note?.usability === "unknown" && note.note && (
                            <span className="absolute top-0.5 right-1 text-[10px] font-bold">
                              ·
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {deviceNotes.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {deviceNotes.map((item) => (
                        <button
                          key={item.port}
                          type="button"
                          onClick={() => openNoteEditor(device, item.port)}
                          className="truncate rounded bg-muted/60 px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                        >
                          <strong className="font-medium text-foreground">
                            {item.port}号
                            {item.usability === "bad"
                              ? ` · ${t("charge.usabilityBad")}`
                              : item.usability === "good"
                                ? ` · ${t("charge.usabilityGood")}`
                                : ""}
                          </strong>
                          {item.note ? ` · ${item.note}` : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  {error && <p className="text-xs text-destructive">{error}</p>}

                  <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
                    <span>
                      {reading
                        ? t("charge.checkedAt", { time: formatTime(reading.checkedAt) })
                        : t("charge.waitingFirstQuery")}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!canQuery}
                      onClick={() => void queryCodes([device.code])}
                    >
                      {isLoading ? t("charge.querying") : t("charge.queryOne")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-sm bg-emerald-500/60" />
          {t("charge.legendIdle")}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-sm bg-amber-500/60" />
          {t("charge.legendBusy")}
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block size-2.5 rounded-sm bg-muted-foreground/30" />
          {t("charge.legendUnknown")}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("charge.footnote")}</p>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(null)}
        >
          <Card
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="text-base">
                {t("charge.noteDialogTitle", { name: editing.name, port: editing.port })}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("charge.noteUsabilityLabel")}
                </span>
                <div className="flex gap-2">
                  {(
                    [
                      ["unknown", t("charge.usabilityUnknown")],
                      ["good", t("charge.usabilityGood")],
                      ["bad", t("charge.usabilityBad")],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={noteUsability === value ? "default" : "outline"}
                      onClick={() => setNoteUsability(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("charge.noteContentLabel")}
                </span>
                <Textarea
                  value={noteText}
                  maxLength={200}
                  rows={3}
                  placeholder={t("charge.notePlaceholder")}
                  onChange={(event) => setNoteText(event.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
                  {t("charge.cancel")}
                </Button>
                <Button type="button" size="sm" onClick={handleSaveNote}>
                  {t("charge.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
