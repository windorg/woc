import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import { filterSync } from 'lib/array'

interface DeleteCardRequest extends NextApiRequest {
  body: {
    cardId: Card['id']
  }
}

export type DeleteCardBody = DeleteCardRequest['body']

const schema: Schema<DeleteCardBody> = yup.object({
  cardId: yup.string().uuid().required(),
})

export default async function deleteCard(req: DeleteCardRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      include: {
        parent: { select: { ownerId: true, settings: true } },
      },
      rejectOnNotFound: true,
    })
    if (!canEditCard(session?.userId ?? null, card)) return res.status(403)

    await prisma.card.delete({
      where: { id: body.cardId },
    })
    await prisma.$transaction(async (prisma) => {
      if (card.parentId !== null) {
        const { childrenOrder } = await prisma.card.findUnique({
          where: { id: card.parentId },
          select: { childrenOrder: true },
          rejectOnNotFound: true,
        })
        await prisma.card.update({
          where: { id: card.parentId },
          data: { childrenOrder: filterSync(childrenOrder, (id) => id !== body.cardId) },
        })
      }
    })
  }

  return res.status(204).send()
}
