import { Board, Card, User, Comment, Reply } from "@prisma/client"
import { Tag } from "taghiro"
import { boardSettings, cardSettings, commentSettings, replySettings } from "./model-settings"

// Types that are just enough to decide if something can be seen
export type PBoard = Pick<Board, 'ownerId' | 'settings'>
export type PCard = Pick<Card, 'ownerId' | 'settings'> & { board: PBoard }
export type PComment = Pick<Comment, 'ownerId' | 'settings'> & { card: PCard }
export type PReply = Pick<Reply, 'authorId' | 'settings'> & { comment: PComment }

export const pBoardSelect = { ownerId: true, settings: true }
export const pCardSelect = { ownerId: true, settings: true, board: { select: pBoardSelect } }
export const pCommentSelect = { ownerId: true, settings: true, card: { select: pCardSelect } }
export const pReplySelect = { authorId: true, settings: true, comment: { select: pCommentSelect } }

export type CanSee = Tag<'can-see'>

export function unsafeCanSee<T>(x: T): T & CanSee {
  return (x as T & CanSee)
}

// Note: it makes sense that these functions should only be callable server-side because there might simply be not
// enough data client-side to decide if something is editable or not (e.g. "only X Y Z people can edit it" but the
// backend won't tell you the exact list of those people)

export function canSeeBoard<T extends PBoard>(userId: User['id'] | null, board: T): board is T & CanSee {
  return board.ownerId === userId
    || boardSettings(board).visibility === 'public'
}
export function canEditBoard<T extends PBoard>(userId: User['id'] | null, board: T) {
  if (!userId) return false // logged-out users cannot edit anything
  return board.ownerId === userId
}

export function canSeeCard<T extends PCard>(userId: User['id'] | null, card: T): card is T & CanSee {
  return card.ownerId === userId
    || (cardSettings(card).visibility === 'public' && canSeeBoard(userId, card.board))
}
export function canEditCard<T extends PCard>(userId: User['id'] | null, card: T) {
  if (!userId) return false // logged-out users cannot edit anything
  return card.ownerId === userId
}

export function canSeeComment<T extends PComment>(userId: User['id'] | null, comment: T): comment is T & CanSee {
  return comment.ownerId === userId
    || (commentSettings(comment).visibility === 'public' && canSeeCard(userId, comment.card))
}
export function canEditComment<T extends PComment>(userId: User['id'] | null, comment: T) {
  if (!userId) return false // logged-out users cannot edit anything
  return comment.ownerId === userId
  // If this logic changes, you should also change the logic in ShowCard.tsx
}
export function canReplyToComment<T extends PComment>(userId: User['id'] | null, comment: T) {
  if (!userId) return false // logged-out users cannot reply to anything
  // You can reply iff you can see the comment.
  return (canSeeComment(userId, comment))
}

export function canSeeReply<T extends PReply>(userId: User['id'] | null, reply: T): reply is T & CanSee {
  return (
    // The author can always see their own replies
    reply.authorId === userId
    // The comment owner can see all public replies to their comment
    || (replySettings(reply).visibility === 'public' && canSeeComment(userId, reply.comment))
  )
}
export function canEditReply<T extends PReply>(userId: User['id'] | null, reply: T) {
  if (!userId) return false // logged-out users cannot edit anything
  return reply.authorId === userId
}
export function canDeleteReply<T extends PReply>(userId: User['id'] | null, reply: T) {
  if (!userId) return false // logged-out users cannot delete anything
  return (
    // The reply's author can always delete their own reply
    reply.authorId === userId
    // The comment's owner can always delete replies to their comments
    || (userId !== null && reply.comment.ownerId === userId)
  )
}
