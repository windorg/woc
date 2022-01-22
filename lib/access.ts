import { Board, Card, User, Comment, Reply } from "@prisma/client"
import { Tag } from "taghiro"
import { prisma } from "./db"
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

const findBoard = (id) => prisma.board.findUnique({
  where: { id },
  select: pBoardSelect,
  rejectOnNotFound: true
})

const findCard = (id) => prisma.card.findUnique({
  where: { id },
  select: pCardSelect,
  rejectOnNotFound: true
})

const findComment = (id) => prisma.comment.findUnique({
  where: { id },
  select: pCommentSelect,
  rejectOnNotFound: true
})

const findReply = (id) => prisma.reply.findUnique({
  where: { id },
  select: pReplySelect,
  rejectOnNotFound: true
})

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
export async function canEditBoard(userId: User['id'] | null, board: Board['id'] | PBoard) {
  if (!userId) return false // logged-out users cannot edit anything
  const board_ = typeof board === 'object' ? board : await findBoard(board)
  return board_.ownerId === userId
}

export function canSeeCard<T extends PCard>(userId: User['id'] | null, card: T): card is T & CanSee {
  return card.ownerId === userId
    || (cardSettings(card).visibility === 'public' && canSeeBoard(userId, card.board))
}
export async function canEditCard(userId: User['id'] | null, card: Card['id'] | PCard) {
  if (!userId) return false // logged-out users cannot edit anything
  const card_ = typeof card === 'object' ? card : await findCard(card)
  return card_.ownerId === userId
}

export function canSeeComment<T extends PComment>(userId: User['id'] | null, comment: T): comment is T & CanSee {
  return comment.ownerId === userId
    || (commentSettings(comment).visibility === 'public' && canSeeCard(userId, comment.card))
}
export async function canEditComment(userId: User['id'] | null, comment: Comment['id'] | PComment) {
  if (!userId) return false // logged-out users cannot edit anything
  const comment_ = typeof comment === 'object' ? comment : await findComment(comment)
  return comment_.ownerId === userId
  // If this logic changes, you should also change the logic in ShowCard.tsx
}
export async function canReplyToComment(userId: User['id'] | null, comment: Comment['id'] | PComment) {
  if (!userId) return false // logged-out users cannot reply to anything
  const comment_ = typeof comment === 'object' ? comment : await findComment(comment)
  // You can reply iff you can see the comment.
  return (await canSeeComment(userId, comment_))
}

export function canSeeReply<T extends PReply>(userId: User['id'] | null, reply: T): reply is T & CanSee {
  return (
    // The author can always see their own replies
    reply.authorId === userId
    // The comment owner can see all public replies to their comment
    || (replySettings(reply).visibility === 'public' && canSeeComment(userId, reply.comment))
  )
}
export async function canEditReply(userId: User['id'] | null, reply: Reply['id'] | PReply) {
  if (!userId) return false // logged-out users cannot edit anything
  const reply_ = typeof reply === 'object' ? reply : await findReply(reply)
  return reply_.authorId === userId
}
export async function canDeleteReply(userId: User['id'] | null, reply: Reply['id'] | PReply) {
  if (!userId) return false // logged-out users cannot delete anything
  const reply_ = typeof reply === 'object' ? reply : await findReply(reply)
  return (
    // The reply's author can always delete their own reply
    reply_.authorId === userId
    // The comment's owner can always delete replies to their comments
    || (userId !== null && reply_.comment.ownerId === userId)
  )
}
