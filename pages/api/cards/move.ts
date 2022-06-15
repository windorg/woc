import { Board, Card, Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { ResponseError, Result, wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditBoard, canEditCard, pBoardSelect } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterSync } from '@lib/array'

export type MoveCardBody = {
  cardId: Card['id']
  boardId: Board['id']
}

const schema: Schema<MoveCardBody> = yup.object({
  cardId: yup.string().uuid().required(),
  boardId: yup.string().uuid().required(),
})

export type MoveCardData = Record<string, never>

export type MoveCardResponse = Result<MoveCardData, { unauthorized: true } | { notFound: true }>

export async function serverMoveCard(session: Session | null, body: MoveCardBody): Promise<MoveCardResponse> {
  const userId = session?.userId ?? null
  const card = await prisma.card.findUnique({
    where: { id: body.cardId },
    include: { board: { select: pBoardSelect } },
  })
  const board = await prisma.board.findUnique({
    where: { id: body.boardId },
  })
  if (!card || !board) return { success: false, error: { notFound: true } }
  if (!canEditCard(userId, card) || !canEditBoard(userId, board)) return { success: false, error: { unauthorized: true } }
  await prisma.$transaction(async prisma => {
    // Move the actual card
    await prisma.card.update({
      where: { id: body.cardId },
      data: { boardId: body.boardId },
    })
    // Delete the card from the old board cardOrder
    const { cardOrder: cardOrderFrom } = await prisma.board.findUnique({
      where: { id: card.boardId },
      select: { cardOrder: true },
      rejectOnNotFound: true,
    })
    await prisma.board.update({
      where: { id: card.boardId },
      data: {
        cardOrder: filterSync(cardOrderFrom, id => id !== body.cardId),
      },
    })
    // Add the card to the new board cardOrder
    const { cardOrder: cardOrderTo } = await prisma.board.findUnique({
      where: { id: body.boardId },
      select: { cardOrder: true },
      rejectOnNotFound: true,
    })
    await prisma.board.update({
      where: { id: body.boardId },
      data: {
        cardOrder: [body.cardId, ...cardOrderTo],
      },
    })
  })
  return { success: true, data: {} }
}

export default async function apiMoveCard(req: NextApiRequest, res: NextApiResponse<MoveCardResponse>) {
  if (req.method === 'POST') {
    const session = await getSession({ req })
    const body = schema.cast(req.body)
    const response = await serverMoveCard(session, body)
    return res.status(200).json(response)
  }
}

export async function callMoveCard(body: MoveCardBody): Promise<MoveCardData>
export async function callMoveCard(body: MoveCardBody, opts: { returnErrors: true }): Promise<MoveCardResponse>
export async function callMoveCard(body: MoveCardBody, opts?) {
  const { data: result } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/move`, body)
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
  if (result.error.notFound) throw new ResponseError('Not found', result.error)
}
