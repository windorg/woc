import { Board, User } from "@prisma/client"
import { boardSettings } from "./model-settings"

export function canSeeBoard(userId: User['id'] | null, board: Board) {
  return boardSettings(board).visibility === 'public' || board.ownerId === userId
}

export function canEditBoard(userId: User['id'] | null, board: Board) {
  return board.ownerId === userId
}