import { Board, Card, User } from "@prisma/client"
import { prisma } from "./db"
import { boardSettings, cardSettings } from "./model-settings"

// Types that are just enough to decide if something can be seen
type PBoard = Pick<Board, 'ownerId' | 'settings'>
type PCard = Pick<Card, 'ownerId' | 'settings'> & { board: PBoard }
type PComment = Pick<Card, 'ownerId' | 'settings'> & { card: PCard }

const pBoardSelect = { ownerId: true, settings: true }
const pCardSelect = { ownerId: true, settings: true, board: { select: pBoardSelect } }
const pCommentSelect = { ownerId: true, settings: true, card: { select: pCardSelect } }

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

// Note: it makes sense that these functions should only be callable server-side because there might simply be not
// enough data client-side to decide if something is editable or not (e.g. "only X Y Z people can edit it" but the
// backend won't tell you the exact list of those people)

export async function canSeeBoard(userId: User['id'] | null, board: Board['id'] | PBoard) {
  const board_ = typeof board === 'object' ? board : await findBoard(board)
  return board_.ownerId === userId
    || boardSettings(board_).visibility === 'public'
}
export async function canEditBoard(userId: User['id'] | null, board: Board['id'] | PBoard) {
  const board_ = typeof board === 'object' ? board : await findBoard(board)
  return board_.ownerId === userId
}

export async function canSeeCard(userId: User['id'] | null, card: Card['id'] | PCard) {
  const card_ = typeof card === 'object' ? card : await findCard(card)
  return card_.ownerId === userId
    || (cardSettings(card_).visibility === 'public' && canSeeBoard(userId, card_.board))
}
export async function canEditCard(userId: User['id'] | null, card: Card['id'] | PCard) {
  const card_ = typeof card === 'object' ? card : await findCard(card)
  return card_.ownerId === userId
}
