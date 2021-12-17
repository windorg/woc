import { Board, Card, User, Comment, Reply } from "@prisma/client"
import { prisma } from "./db"
import { boardSettings, cardSettings, commentSettings, replySettings } from "./model-settings"

// Types that are just enough to decide if something can be seen
type PBoard = Pick<Board, 'ownerId' | 'settings'>
type PCard = Pick<Card, 'ownerId' | 'settings'> & { board: PBoard }
type PComment = Pick<Comment, 'ownerId' | 'settings'> & { card: PCard }
type PReply = Pick<Reply, 'authorId' | 'settings'> & { comment: PComment }

const pBoardSelect = { ownerId: true, settings: true }
const pCardSelect = { ownerId: true, settings: true, board: { select: pBoardSelect } }
const pCommentSelect = { ownerId: true, settings: true, card: { select: pCardSelect } }
const pReplySelect = { authorId: true, settings: true, comment: { select: pCommentSelect } }

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

// Note: it makes sense that these functions should only be callable server-side because there might simply be not
// enough data client-side to decide if something is editable or not (e.g. "only X Y Z people can edit it" but the
// backend won't tell you the exact list of those people)

export async function canSeeBoard(userId: User['id'] | null, board: Board['id'] | PBoard) {
  const board_ = typeof board === 'object' ? board : await findBoard(board)
  return board_.ownerId === userId
    || boardSettings(board_).visibility === 'public'
}
export async function canEditBoard(userId: User['id'] | null, board: Board['id'] | PBoard) {
  if (!userId) return false // logged-out users cannot edit anything
  const board_ = typeof board === 'object' ? board : await findBoard(board)
  return board_.ownerId === userId
}

export async function canSeeCard(userId: User['id'] | null, card: Card['id'] | PCard) {
  const card_ = typeof card === 'object' ? card : await findCard(card)
  return card_.ownerId === userId
    || (cardSettings(card_).visibility === 'public' && canSeeBoard(userId, card_.board))
}
export async function canEditCard(userId: User['id'] | null, card: Card['id'] | PCard) {
  if (!userId) return false // logged-out users cannot edit anything
  const card_ = typeof card === 'object' ? card : await findCard(card)
  return card_.ownerId === userId
}

export async function canSeeComment(userId: User['id'] | null, comment: Comment['id'] | PComment) {
  const comment_ = typeof comment === 'object' ? comment : await findComment(comment)
  return comment_.ownerId === userId
    || (commentSettings(comment_).visibility === 'public' && canSeeCard(userId, comment_.card))
}
export async function canEditComment(userId: User['id'] | null, comment: Comment['id'] | PComment) {
  if (!userId) return false // logged-out users cannot edit anything
  const comment_ = typeof comment === 'object' ? comment : await findComment(comment)
  return comment_.ownerId === userId
  // If this logic changes, you should also change the logic in ShowCard.tsx
}

export async function canSeeReply(userId: User['id'] | null, reply: Reply['id'] | PReply) {
  const reply_ = typeof reply === 'object' ? reply : await findReply(reply)
  return (
    // The author can always see their own replies
    reply_.authorId === userId
    // The comment owner can see all public replies to their comment
    || (replySettings(reply_).visibility === 'public' && canSeeComment(userId, reply_.comment))
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
