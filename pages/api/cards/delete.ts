import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'

interface DeleteCardRequest extends NextApiRequest {
  body: {
    cardId: Card['id']
  }
}

export type DeleteCardBody = DeleteCardRequest['body']

const schema: SchemaOf<DeleteCardBody> = yup.object({
  cardId: yup.string().uuid().required()
})

export default async function deleteCard(req: DeleteCardRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      include: {
        board: { select: { ownerId: true, settings: true } }
      },
      rejectOnNotFound: true,
    })
    if (!await canEditCard(session?.userId, card)) return res.status(403)

    await prisma.card.delete({
      where: { id: body.cardId }
    })

    return res.status(204)
  }
}

export async function callDeleteCard(body: DeleteCardBody): Promise<void> {
  axios.post('/api/cards/delete', body)
}
