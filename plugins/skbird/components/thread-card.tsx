import type { MouseEvent } from "react"
import { BadgeCheck, Eye, MessageSquare, ThumbsUp } from "lucide-react"
import type { Translator } from "@orahako/sdk"
import { Badge } from "@orahako/ui-primitives"
import { skbirdImageUrl } from "../client"
import type { SkbirdDictionary } from "../i18n"
import { isCertThread, type SkbirdThread } from "../types"
import { SkbirdImage, type SkbirdMediaAccess } from "./skbird-image"

export function SkbirdThreadCard({
  media,
  t,
  thread,
  href,
  onOpen,
}: {
  media: SkbirdMediaAccess
  t: Translator<SkbirdDictionary>
  thread: SkbirdThread
  href: string
  onOpen?: () => void
}) {
  const cert = isCertThread(thread)
  const hidden = cert && !thread.title && !thread.content

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !onOpen ||
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
    onOpen()
  }

  return (
    <a href={href} className="block border-t first:border-t-0 sm:border-t-0" onClick={handleClick}>
      <div className="flex flex-col gap-2 py-3 transition-colors sm:rounded-xl sm:bg-card sm:p-4 sm:text-sm sm:text-card-foreground sm:ring-1 sm:ring-foreground/10 sm:hover:bg-muted/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {thread.avatarUrl ? (
            <SkbirdImage
              media={media}
              t={t}
              url={skbirdImageUrl(thread.avatarUrl, { w: 64, h: 64 })}
              alt={thread.nickname}
              className="size-5 shrink-0 rounded-full object-cover"
            />
          ) : null}
          <span className="truncate">{thread.nickname}</span>
          {thread.userLevelTitle ? <Badge variant="outline">{thread.userLevelTitle}</Badge> : null}
          <span className="ml-auto shrink-0">{thread.postTimeText}</span>
        </div>

        {hidden ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="size-4 shrink-0" />
            {t("skbird.certHidden")}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="leading-snug font-medium">{thread.title}</span>
              {cert ? <Badge variant="secondary">{t("skbird.certBadge")}</Badge> : null}
            </div>
            {thread.content ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">{thread.content}</p>
            ) : null}
          </>
        )}

        {thread.imgPaths.length > 0 ? (
          <div className="flex gap-2">
            {thread.imgPaths.slice(0, 3).map((p) => (
              <SkbirdImage
                media={media}
                t={t}
                key={p}
                url={skbirdImageUrl(p, { w: 200, h: 200 })}
                alt=""
                className="size-20 rounded-md object-cover"
              />
            ))}
            {thread.imgPaths.length > 3 ? (
              <div className="flex size-20 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                +{thread.imgPaths.length - 3}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {thread.cateName ? <span>{thread.cateName}</span> : null}
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="size-3" />
            {thread.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" />
            {thread.commentCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3" />
            {thread.viewCount}
          </span>
        </div>
      </div>
    </a>
  )
}
