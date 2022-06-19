import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { ResponseError, Result, wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterSync } from '@lib/array'

export type MoveCardBody = {
  // Move this card
  cardId: Card['id']
  // ...into this parent
  parentId: Card['id']
}

const schema: Schema<MoveCardBody> = yup.object({
  cardId: yup.string().uuid().required(),
  parentId: yup.string().uuid().required(),
})

export type MoveCardData = Record<string, never>

export type MoveCardResponse = Result<MoveCardData, { unauthorized: true } | { notFound: true }>

// NB: only works for cards and not for boards at the moment, because boards don't have parents
export async function serverMoveCard(session: Session | null, body: MoveCardBody): Promise<MoveCardResponse> {
  const userId = session?.userId ?? null
  const card = await prisma.card.findUnique({
    where: { id: body.cardId },
  })
  const board = await prisma.card.findUnique({
    where: { id: body.parentId },
  })
  if (!card || !board) return { success: false, error: { notFound: true } }
  if (!canEditCard(userId, card) || !canEditCard(userId, board)) return { success: false, error: { unauthorized: true } }
  await prisma.$transaction(async prisma => {
    // Move the actual card
    await prisma.card.update({
      where: { id: body.cardId },
      data: { parentId: body.parentId },
    })
    // Delete the card from the old board childrenOrder
    const { childrenOrder: childrenOrderFrom } = await prisma.card.findUnique({
      where: { id: card.parentId! },
      select: { childrenOrder: true },
      rejectOnNotFound: true,
    })
    await prisma.card.update({
      where: { id: card.parentId! },
      data: {
        childrenOrder: filterSync(childrenOrderFrom, id => id !== body.cardId),
      },
    })
    // Add the card to the new board childrenOrder
    const { childrenOrder: childrenOrderTo } = await prisma.card.findUnique({
      where: { id: body.parentId },
      select: { childrenOrder: true },
      rejectOnNotFound: true,
    })
    await prisma.card.update({
      where: { id: body.parentId },
      data: {
        childrenOrder: [body.cardId, ...childrenOrderTo],
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
