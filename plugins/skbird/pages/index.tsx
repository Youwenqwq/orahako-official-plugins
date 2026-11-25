import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { Bell, Bird, Search, Settings, User, X } from "lucide-react"
import type {
  DerivedComponentProps,
  ObservableSource,
  SlotComponent,
} from "@orahako/sdk"
import {
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  cn,
  useBackHandler,
  useIsMobile,
} from "@orahako/ui-primitives"
import {
  SKBIRD_ERRNO_TOKEN_INVALID,
  SkbirdError,
  type SkbirdClient,
} from "../client"
import type { SkbirdDictionary } from "../i18n"
import type { SkbirdConfigStoreInstance } from "../store"
import type { SkbirdCategory, SkbirdThread } from "../types"
import {
  type SkbirdFeedIdentity,
  type SkbirdFeedSnapshot,
  type SkbirdFeedTab,
  sameSkbirdFeedIdentity,
} from "../feed-state"
import { SkbirdThreadCard } from "../components/thread-card"
import { useLoadMoreSentinel } from "../components/use-load-more-sentinel"
import type { SkbirdMediaAccess } from "../components/skbird-image"

type FeedTab = SkbirdFeedTab
/** 时间游标分页的 tab（from_time = 末条 postTime） */
const CURSOR_TABS: Record<string, true> = { latest: true, reward: true }

/** 搜索时间范围（值来自 /thread/v2/searchoptions 的 range_options，文档已固定） */
const SEARCH_RANGES = [
  { value: "all", labelKey: "skbird.rangeAll" },
  { value: "1d", labelKey: "skbird.range1d" },
  { value: "3d", labelKey: "skbird.range3d" },
  { value: "7d", labelKey: "skbird.range7d" },
  { value: "1m", labelKey: "skbird.range1m" },
  { value: "6m", labelKey: "skbird.range6m" },
  { value: "1y", labelKey: "skbird.range1y" },
  { value: "2y", labelKey: "skbird.range2y" },
] as const

export interface SkbirdIndexInject {
  readonly hooks: {
    readonly hydrated: ObservableSource<boolean>
    readonly unread: ObservableSource<number>
  }
  readonly getClient: () => SkbirdClient | null
  readonly media: SkbirdMediaAccess
  readonly pageHref: (page: string, params?: Record<string, string>) => string
  readonly openPage: (page: string, params?: Record<string, string>) => void
  readonly readFeedState: (identity: SkbirdFeedIdentity) => SkbirdFeedSnapshot | null
  readonly writeFeedState: (
    identity: SkbirdFeedIdentity,
    snapshot: SkbirdFeedSnapshot
  ) => void
  readonly refreshUnread: () => Promise<void>
}

export type SkbirdIndexPageProps = DerivedComponentProps<
  Record<string, never>,
  SkbirdDictionary,
  undefined,
  SkbirdConfigStoreInstance,
  SkbirdIndexInject
>

export const SkbirdIndexPage: SlotComponent<SkbirdIndexPageProps> = (props) => {
  const {
    t,
    useStore,
    useHydrated,
    useUnread,
    getClient,
    media,
    pageHref,
    openPage,
    readFeedState,
    writeFeedState,
    refreshUnread,
  } = props
  const token = useStore((state) => state.token)
  const deviceId = useStore((state) => state.deviceId)
  const alias = useStore((state) => state.alias)
  const identity = useMemo<SkbirdFeedIdentity>(
    () => ({ token, deviceId, alias }),
    [token, deviceId, alias]
  )
  const hasHydrated = useHydrated()
  const unread = useUnread()
  const isMobile = useIsMobile()

  const [tab, setTab] = useState<FeedTab>("hot")
  const [wd, setWd] = useState("")
  const [submittedWd, setSubmittedWd] = useState("")
  const [cateId, setCateId] = useState("latest")
  const [categories, setCategories] = useState<SkbirdCategory[]>([])
  const [threads, setThreads] = useState<SkbirdThread[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState("all")
  const [searchOpen, setSearchOpen] = useState(false)
  useBackHandler(() => setSearchOpen(false), isMobile && searchOpen)
  const cursorRef = useRef("0")
  const searchPageRef = useRef(1)
  const busyRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [feedStateReady, setFeedStateReady] = useState(false)
  const [feedEpoch, setFeedEpoch] = useState(0)
  const identityRef = useRef<SkbirdFeedIdentity | null>(null)
  const feedGenerationRef = useRef(0)
  const restoredRef = useRef(false)
  const snapshotAvailableRef = useRef(false)
  const scrollRestoredRef = useRef(false)
  const navigationScrollCapturedRef = useRef(false)
  const scrollRestoreAppliedRef = useRef(false)
  const restoredScrollRef = useRef({ scrollY: 0, mainScrollTop: 0 })
  const scrollRef = useRef({ scrollY: 0, mainScrollTop: 0 })
  const feedStateRef = useRef<SkbirdFeedSnapshot | null>(null)
  const persistRef = useRef<() => void>(() => {})

  useEffect(() => {
    feedStateRef.current = {
      version: 1,
      tab,
      wd,
      submittedWd,
      cateId,
      range,
      threads,
      hasMore,
      cursor: cursorRef.current,
      searchPage: searchPageRef.current,
      searchOpen,
      scrollY: scrollRef.current.scrollY,
      mainScrollTop: scrollRef.current.mainScrollTop,
    }
    persistRef.current = () => {
      if (
        !hasHydrated ||
        !token ||
        !sameSkbirdFeedIdentity(identityRef.current, identity) ||
        !feedStateRef.current
      ) {
        return
      }
      writeFeedState(identity, {
        ...feedStateRef.current,
        cursor: cursorRef.current,
        searchPage: searchPageRef.current,
        scrollY: scrollRef.current.scrollY,
        mainScrollTop: scrollRef.current.mainScrollTop,
      })
    }
  }, [
    hasHydrated,
    token,
    identity,
    tab,
    wd,
    submittedWd,
    cateId,
    range,
    searchOpen,
    threads,
    hasMore,
    feedEpoch,
    writeFeedState,
  ])

  const captureScrollBeforeNavigation = useCallback(() => {
    navigationScrollCapturedRef.current = true
    scrollRef.current = {
      scrollY: window.scrollY,
      mainScrollTop: document.querySelector("main")?.scrollTop ?? 0,
    }
    persistRef.current()
  }, [])

  // 离开列表页前记录滚动位置；桌面端滚动容器是 main，移动端通常是 window。
  useEffect(() => {
    const updateScroll = () => {
      scrollRef.current = {
        scrollY: window.scrollY,
        mainScrollTop: document.querySelector("main")?.scrollTop ?? 0,
      }
    }
    window.addEventListener("scroll", updateScroll, { passive: true })
    const main = document.querySelector("main")
    main?.addEventListener("scroll", updateScroll, { passive: true })
    return () => {
      if (!navigationScrollCapturedRef.current) updateScroll()
      persistRef.current()
      window.removeEventListener("scroll", updateScroll)
      main?.removeEventListener("scroll", updateScroll)
    }
  }, [])

  useEffect(() => {
    if (snapshotAvailableRef.current && !scrollRestoreAppliedRef.current) return
    persistRef.current()
  }, [
    hasHydrated,
    token,
    identity,
    tab,
    wd,
    submittedWd,
    cateId,
    range,
    searchOpen,
    threads,
    hasMore,
  ])

  useEffect(() => {
    if (
      !snapshotAvailableRef.current ||
      scrollRestoredRef.current ||
      !hasHydrated ||
      !token ||
      !feedStateReady
    ) {
      return
    }
    scrollRestoredRef.current = true
    const restoreScroll = () => {
      const position = restoredScrollRef.current
      scrollRef.current = position
      window.scrollTo({ top: position.scrollY, behavior: "auto" })
      document.querySelector("main")?.scrollTo({ top: position.mainScrollTop, behavior: "auto" })
      scrollRestoreAppliedRef.current = true
      persistRef.current()
    }
    let timeout: number | undefined
    const frame = requestAnimationFrame(() => {
      restoreScroll()
      timeout = window.setTimeout(restoreScroll, 100)
    })
    return () => {
      cancelAnimationFrame(frame)
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, [hasHydrated, token, feedStateReady, threads.length])

  // 移动端搜索展开时自动聚焦
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const mapError = useCallback(
    (e: unknown) =>
      e instanceof SkbirdError && e.errno === SKBIRD_ERRNO_TOKEN_INVALID
        ? t("skbird.tokenExpired")
        : t("skbird.loadFailed", {
            message: e instanceof Error ? e.message : String(e),
          }),
    [t]
  )

  const fetchPage = useCallback(
    async (append: boolean): Promise<void> => {
      const client = getClient()
      if (!client || busyRef.current) return
      const generation = feedGenerationRef.current
      busyRef.current = true
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError(null)
      try {
        let list: SkbirdThread[]
        if (submittedWd) {
          const page = append ? searchPageRef.current + 1 : 1
          list = await client.search(submittedWd, page, range === "all" ? "" : range)
          // 身份切换后旧账号的响应不得回写游标、列表或 loading 状态。
          if (feedGenerationRef.current !== generation) return
          searchPageRef.current = page
          setHasMore(list.length > 0)
        } else if (tab === "hot") {
          list = await client.hot()
          if (feedGenerationRef.current !== generation) return
          setHasMore(false)
        } else if (tab === "top") {
          list = await client.toplist()
          if (feedGenerationRef.current !== generation) return
          setHasMore(false)
        } else {
          const fromTime = append ? cursorRef.current : "0"
          list =
            tab === "reward"
              ? await client.rewardList(fromTime)
              : await client.latest(fromTime, cateId)
          if (feedGenerationRef.current !== generation) return
          cursorRef.current = list.length > 0 ? String(list[list.length - 1]!.postTime) : "0"
          setHasMore(list.length > 0)
        }
        setThreads((prev) => (append ? [...prev, ...list] : list))
      } catch (e) {
        if (feedGenerationRef.current === generation) setError(mapError(e))
      } finally {
        if (feedGenerationRef.current === generation) {
          setLoading(false)
          setLoadingMore(false)
          busyRef.current = false
        }
      }
    },
    [tab, cateId, submittedWd, range, mapError, getClient]
  )

  // 首屏加载；若存在同一账号的详情页返回快照，则直接使用快照，条件变化仍按原逻辑重新加载。
  useEffect(() => {
    if (!hasHydrated || !token || !feedStateReady) return
    if (!sameSkbirdFeedIdentity(identityRef.current, identity)) return
    if (restoredRef.current) {
      restoredRef.current = false
      return
    }
    cursorRef.current = "0"
    searchPageRef.current = 1
    void fetchPage(false)
  }, [hasHydrated, token, identity, feedStateReady, feedEpoch, fetchPage])

  // 首次装载或账号身份变化：只恢复同一账号的会话快照。身份不一致时
  // feed-state store 返回 null，列表清空后照常执行新账号的首屏请求。
  useEffect(() => {
    if (!hasHydrated || !token) return
    if (sameSkbirdFeedIdentity(identityRef.current, identity)) return

    identityRef.current = identity
    // 旧账号在途响应（含分页）一律作废，避免回写游标或列表。
    feedGenerationRef.current += 1
    busyRef.current = false
    setLoading(false)
    setLoadingMore(false)
    setError(null)
    restoredRef.current = false
    snapshotAvailableRef.current = false
    scrollRestoredRef.current = false
    scrollRestoreAppliedRef.current = false
    cursorRef.current = "0"
    searchPageRef.current = 1

    const snapshot = readFeedState(identity)
    if (snapshot) {
      restoredRef.current = true
      snapshotAvailableRef.current = true
      restoredScrollRef.current = {
        scrollY: snapshot.scrollY,
        mainScrollTop: snapshot.mainScrollTop,
      }
      cursorRef.current = snapshot.cursor
      searchPageRef.current = snapshot.searchPage
      setTab(snapshot.tab)
      setWd(snapshot.wd)
      setSubmittedWd(snapshot.submittedWd)
      setCateId(snapshot.cateId)
      setRange(snapshot.range)
      setSearchOpen(snapshot.searchOpen)
      setThreads(snapshot.threads)
      setHasMore(snapshot.hasMore)
    } else {
      setTab("hot")
      setWd("")
      setSubmittedWd("")
      setCateId("latest")
      setRange("all")
      setSearchOpen(false)
      setThreads([])
      setHasMore(false)
      setCategories([])
    }
    setFeedStateReady(true)
    // 即使筛选条件碰巧与旧账号相同，也要触发一次首屏加载。
    setFeedEpoch((value) => value + 1)
  }, [hasHydrated, token, identity, readFeedState])

  // 分类列表：进入页面或身份变化后拉取一次，失败静默
  useEffect(() => {
    const client = getClient()
    if (!hasHydrated || !client) return
    const generation = feedGenerationRef.current
    client
      .categories()
      .then((list) => {
        if (feedGenerationRef.current === generation) setCategories(list)
      })
      .catch(() => {})
  }, [hasHydrated, token, identity, getClient])

  // 与旧实现一致：每次回到列表页刷新一次未读数（插件激活时也会刷新）。
  useEffect(() => {
    if (!hasHydrated || !token) return
    void refreshUnread()
  }, [hasHydrated, token, refreshUnread])

  const canLoadMore = ((CURSOR_TABS[tab] && !submittedWd) || !!submittedWd) && hasMore
  const sentinelRef = useLoadMoreSentinel(
    () => void fetchPage(true),
    canLoadMore && !loading && !error
  )

  const handleLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, page: string, params?: Record<string, string>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      event.preventDefault()
      openPage(page, params)
    },
    [openPage]
  )

  if (hasHydrated && !token) {
    return (
      <div className="p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bird />
            </EmptyMedia>
            <EmptyTitle>{t("skbird.noToken")}</EmptyTitle>
            <EmptyDescription>{t("skbird.noTokenHint")}</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => openPage("settings")}>{t("skbird.goSettings")}</Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-sm:px-2">
      <div className="flex items-center gap-2">
        {/* tab 栏：移动端搜索展开时让位 */}
        <div
          className={cn(
            "shrink-0 transition-all duration-300",
            searchOpen && "max-sm:w-0 max-sm:overflow-hidden max-sm:opacity-0"
          )}
        >
          <Tabs
            value={submittedWd ? "" : tab}
            onValueChange={(v) => {
              setSubmittedWd("")
              setWd("")
              setTab(v as FeedTab)
            }}
          >
            <TabsList>
              <TabsTrigger value="hot">{t("skbird.tabHot")}</TabsTrigger>
              <TabsTrigger value="latest">{t("skbird.tabLatest")}</TabsTrigger>
              <TabsTrigger value="top">{t("skbird.tabTop")}</TabsTrigger>
              <TabsTrigger value="reward">{t("skbird.tabReward")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 移动端默认收起为搜索按钮 */}
        {!searchOpen && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="ml-auto sm:hidden"
            aria-label={t("skbird.searchPlaceholder")}
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
          </Button>
        )}

        {/* 搜索表单：桌面端常显；移动端展开时动画占据 tab 栏位置 */}
        <form
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            searchOpen
              ? "max-sm:flex-1"
              : "max-sm:pointer-events-none max-sm:w-0 max-sm:overflow-hidden max-sm:opacity-0 sm:ml-auto"
          )}
          onSubmit={(e) => {
            e.preventDefault()
            setSubmittedWd(wd.trim())
          }}
        >
          {wd || submittedWd ? (
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-28 shrink-0" aria-label={t("skbird.rangeAll")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            ref={searchInputRef}
            value={wd}
            onChange={(e) => setWd(e.target.value)}
            onBlur={(e) => {
              // 失焦恢复 tab 栏；焦点在表单内流转（如点提交/筛选）不算失焦
              if (!wd && !e.currentTarget.form?.contains(e.relatedTarget as Node | null)) {
                setSearchOpen(false)
              }
            }}
            placeholder={t("skbird.searchPlaceholder")}
            className="w-40 max-sm:min-w-0 max-sm:flex-1 sm:w-56"
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            aria-label={t("skbird.searchPlaceholder")}
          >
            <Search className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="sm:hidden"
            aria-label={t("skbird.cancelSearch")}
            onClick={() => setSearchOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </form>

        {/* 桌面功能入口；移动端消息与我的位于底栏，设置位于顶栏 */}
        <div className="flex items-center max-sm:hidden">
          <Button
            asChild
            size="icon"
            variant="ghost"
            aria-label={t("skbird.messagesTitle")}
            className="relative"
          >
            <a
              href={pageHref("messages")}
              onClick={(event) => handleLinkClick(event, "messages")}
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive" />
              ) : null}
            </a>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label={t("skbird.meTitle")}>
            <a href={pageHref("me")} onClick={(event) => handleLinkClick(event, "me")}>
              <User className="size-4" />
            </a>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label={t("skbird.settingsTitle")}>
            <a href={pageHref("settings")} onClick={(event) => handleLinkClick(event, "settings")}>
              <Settings className="size-4" />
            </a>
          </Button>
        </div>
      </div>

      {!submittedWd && tab === "latest" && categories.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            {
              cateId: "latest",
              name: t("skbird.allCategories"),
              summary: "",
              iconPath: "",
            },
            ...categories,
          ].map((c) => (
            <Badge
              key={c.cateId}
              variant={cateId === c.cateId ? "default" : "outline"}
              className="shrink-0 cursor-pointer"
              onClick={() => setCateId(c.cateId)}
            >
              {c.name}
            </Badge>
          ))}
        </div>
      ) : null}

      {error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{error}</EmptyTitle>
          </EmptyHeader>
          <Button variant="outline" onClick={() => openPage("settings")}>
            {t("skbird.goSettings")}
          </Button>
        </Empty>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("skbird.empty")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-3 max-sm:gap-0">
            {threads.map((thread, i) => (
              <SkbirdThreadCard
                media={media}
                t={t}
                key={thread.threadId || `t-${i}`}
                thread={thread}
                href={pageHref("thread", { id: thread.threadId })}
                onOpen={() => {
                  captureScrollBeforeNavigation()
                  openPage("thread", { id: thread.threadId })
                }}
              />
            ))}
          </div>
          {(CURSOR_TABS[tab] && !submittedWd) || submittedWd ? (
            <>
              {/* 触底自动加载哨兵 */}
              <div ref={sentinelRef} className="h-1" />
              {loadingMore ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {t("skbird.loadingMore")}
                </p>
              ) : !hasMore ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  {t("skbird.noMore")}
                </p>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
