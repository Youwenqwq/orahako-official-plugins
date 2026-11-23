import { useState } from "react"
import { ThumbsUp } from "lucide-react"
import type { Translator } from "@orahako/sdk"
import { Badge } from "@orahako/ui-primitives"
import { skbirdImageUrl } from "../client"
import type { SkbirdDictionary } from "../i18n"
import type { SkbirdComment } from "../types"
import { SkbirdImage, type SkbirdMediaAccess } from "./skbird-image"

export function SkbirdCommentItem({
  media,
  t,
  comment,
  threadId,
  likeComment,
  depth = 0,
}: {
  media: SkbirdMediaAccess
  t: Translator<SkbirdDictionary>
  comment: SkbirdComment
  threadId: string
  likeComment: (threadId: string, commentId: string, action: 0 | 1) => Promise<void>
  depth?: number
}) {
  const [likeHas, setLikeHas] = useState(comment.likeHas)
  const [likeCount, setLikeCount] = useState(comment.likeCount)
  const [pending, setPending] = useState(false)

  async function handleLike() {
    if (pending) return
    setPending(true)
    const next = !likeHas
    try {
      await likeComment(threadId, comment.commentId, next ? 1 : 0)
      setLikeHas(next)
      setLikeCount((c) => c + (next ? 1 : -1))
    } catch {
      // 失败静默：状态不翻转
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l pl-3" : undefined}>
      <div className="flex gap-2.5">
        {comment.avatarUrl ? (
          <SkbirdImage
            media={media}
            t={t}
            url={skbirdImageUrl(comment.avatarUrl, { w: 64, h: 64 })}
            alt={comment.nickname}
            className="mt-0.5 size-7 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{comment.nickname}</span>
            {comment.isAuthor ? <Badge variant="secondary">{t("skbird.authorBadge")}</Badge> : null}
            {comment.userLevelTitle ? (
              <Badge variant="outline">{comment.userLevelTitle}</Badge>
            ) : null}
            <span className="ml-auto shrink-0">{comment.postTimeText}</span>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          <button
            type="button"
            onClick={handleLike}
            disabled={pending}
            className={`inline-flex w-fit items-center gap-1 py-0.5 text-xs ${
              likeHas ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ThumbsUp className="size-3" />
            {likeCount}
            {comment.authorLiked ? (
              <Badge variant="outline" className="ml-1">
                {t("skbird.authorLiked")}
              </Badge>
            ) : null}
          </button>
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {comment.replies.map((r) => (
            <SkbirdCommentItem
              media={media}
              t={t}
              key={r.commentId}
              comment={r}
              threadId={threadId}
              likeComment={likeComment}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
