import { useCallback, useEffect, useRef, useState } from "react"
import type {
  DerivedComponentProps,
  ObservableSource,
  SlotComponent,
} from "@orahako/sdk"
import {
  Button,
  Card,
  CardContent,
  Empty,
  EmptyHeader,
  EmptyTitle,
  Skeleton,
} from "@orahako/ui-primitives"
import {
  SKBIRD_ERRNO_TOKEN_INVALID,
  SkbirdError,
  skbirdImageUrl,
  type SkbirdClient,
} from "../client"
import type { SkbirdDictionary } from "../i18n"
import type { SkbirdConfigStoreInstance } from "../store"
import type { SkbirdMessage, SkbirdUnread } from "../types"
import { SkbirdImage, type SkbirdMediaAccess } from "../components/skbird-image"
import { useLoadMoreSentinel } from "../components/use-load-more-sentinel"

export interface SkbirdMessagesInject {
  readonly hooks: {
    readonly hydrated: ObservableSource<boolean>
  }
  readonly getClient: () => SkbirdClient | null
  readonly media: SkbirdMediaAccess
  readonly setUnread: (count: number) => void
  readonly openSettings: () => void
}

export type SkbirdMessagesPageProps = DerivedComponentProps<
  Record<string, never>,
  SkbirdDictionary,
  undefined,
  SkbirdConfigStoreInstance,
  SkbirdMessagesInject
>

export const SkbirdMessagesPage: SlotComponent<SkbirdMessagesPageProps> = (props) => {
  const { t, useStore, useHydrated, getClient, media, setUnread, openSettings } = props
  const token = useStore((state) => state.token)
  const hasHydrated = useHydrated()

  const [messages, setMessages] = useState<SkbirdMessage[]>([])
  const [unread, setUnreadState] = useState<SkbirdUnread | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef("0")
  const busyRef = useRef(false)

  const load = useCallback(
    async (append: boolean) => {
      const client = getClient()
      if (!client || busyRef.current) return
      busyRef.current = true
      if (append) setLoadingMore(true)
      else setLoading(true)
      try {
        const fromTime = append ? cursorRef.current : "0"
        const list = await client.messages(fromTime)
        cursorRef.current = list.length > 0 ? String(list[list.length - 1]!.time) : "0"
        setHasMore(list.length > 0)
        setMessages((prev) => (append ? [...prev, ...list] : list))
      } catch (e) {
        setError(
          e instanceof SkbirdError && e.errno === SKBIRD_ERRNO_TOKEN_INVALID
            ? t("skbird.tokenExpired")
            : t("skbird.loadFailed", {
                message: e instanceof Error ? e.message : String(e),
              })
        )
      } finally {
        setLoading(false)
        setLoadingMore(false)
        busyRef.current = false
      }
    },
    [t, getClient]
  )

  const sentinelRef = useLoadMoreSentinel(() => void load(true), hasMore && !loading && !error)

  useEffect(() => {
    const client = getClient()
    if (!hasHydrated || !client) return
    void load(false)
    client
      .unreadNum()
      .then((value) => {
        setUnreadState(value)
        setUnread(value.count + value.imCount)
      })
      .catch(() => {})
  }, [hasHydrated, token, load, setUnread, getClient])

  if (hasHydrated && !token) {
    return (
      <div className="p-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("skbird.noToken")}</EmptyTitle>
          </EmptyHeader>
          <Button onClick={() => openSettings()}>{t("skbird.goSettings")}</Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {unread ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Card>
            <CardContent className="p-3">
              <div className="text-lg font-semibold">{unread.count}</div>
              <div className="text-xs text-muted-foreground">{t("skbird.unreadSection")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-lg font-semibold">{unread.imCount}</div>
              <div className="text-xs text-muted-foreground">{t("skbird.imCountLabel")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-lg font-semibold">{unread.markCount}</div>
              <div className="text-xs text-muted-foreground">{t("skbird.markUpdatesLabel")}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{error}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t("skbird.messagesEmpty")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {messages.map((m, i) => (
              <Card key={m.id || i}>
                <CardContent className="flex gap-3 p-3">
                  {m.avatarUrl ? (
                    <SkbirdImage
                      media={media}
                      t={t}
                      url={skbirdImageUrl(m.avatarUrl, { w: 64, h: 64 })}
                      alt={m.nickname}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : null}
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {m.nickname ? <span className="truncate">{m.nickname}</span> : null}
                      <span className="ml-auto shrink-0">{m.timeText}</span>
                    </div>
                    {m.title ? <div className="text-sm font-medium">{m.title}</div> : null}
                    {m.content ? (
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {m.content}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div ref={sentinelRef} className="h-1" />
          {loadingMore ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {t("skbird.loadingMore")}
            </p>
          ) : !hasMore ? (
            <p className="py-2 text-center text-xs text-muted-foreground">{t("skbird.noMore")}</p>
          ) : null}
        </>
      )}
    </div>
  )
}
