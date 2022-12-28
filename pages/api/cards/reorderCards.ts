import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { Result } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import { Session } from 'next-auth'
import { filterSync, insertAfter, insertBefore, insertPosition } from 'lib/array'

export type ReorderCardsBody = {
  parentId: Card['id']
  cardId: Card['id']
} & ( // The new index that the card should have in the board
  | { position: number }
  // The card that the cardId should be moved before
  | { before: Card['id'] }
  // The card that the cardId should be moved after
  | { after: Card['id'] }
)

const schema: Schema<ReorderCardsBody> = yup
  .object({
    parentId: yup.string().uuid().required(),
    cardId: yup.string().uuid().required(),
    position: yup.number().integer().min(0),
    before: yup.string().uuid(),
    after: yup.string().uuid(),
  })
  .test('exactly-one-of-required', "Must have exactly one of: 'position', 'before', 'after'", (value) => {
    return filterSync(['position', 'before', 'after'], (key) => key in value).length === 1
  }) as Schema<ReorderCardsBody>

export type ReorderCardsData = {
  childrenOrder: Card['childrenOrder']
}

export type ReorderCardsResponse = Result<ReorderCardsData, { unauthorized: true } | { notFound: true }>

export async function serverReorderCards(
  session: Session | null,
  body: ReorderCardsBody
): Promise<ReorderCardsResponse> {
  const userId = session?.userId ?? null
  const card = await prisma.card.findUnique({
    where: { id: body.cardId },
  })
  if (!card) return { success: false, error: { notFound: true } }
  if (card.parentId !== body.parentId) return { success: false, error: { notFound: true } }
  const board = await prisma.card.findUnique({
    where: { id: body.parentId },
  })
  if (!board) return { success: false, error: { notFound: true } }
  if (!canEditCard(userId, board)) return { success: false, error: { unauthorized: true } }

  const newCardOrder = await prisma.$transaction(async (prisma) => {
    const { childrenOrder } = await prisma.card.findUnique({
      where: { id: board.id },
      select: { childrenOrder: true },
      rejectOnNotFound: true,
    })
    const filtered = filterSync(childrenOrder, (x) => x !== card.id)
    const newCardOrder =
      'position' in body
        ? insertPosition(card.id, filtered, body.position)
        : 'before' in body
        ? insertBefore(card.id, filtered, body.before)
        : 'after' in body
        ? insertAfter(card.id, filtered, body.after)
        : (() => {
            throw new Error('Unknown reorder request')
          })()
    await prisma.card.update({
      where: { id: board.id },
      data: { childrenOrder: newCardOrder },
    })
    return newCardOrder
  })
  return { success: true, data: { childrenOrder: newCardOrder } }
}

export default async function apiReorderCards(req: NextApiRequest, res: NextApiResponse<ReorderCardsResponse>) {
  if (req.method === 'POST') {
    const session = await getSession({ req })
    const body = schema.cast(req.body)
    const response = await serverReorderCards(session, body)
    return res.status(200).json(response)
  }
}
