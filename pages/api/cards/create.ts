import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'

interface CreateCardRequest extends NextApiRequest {
  body: {
    boardId: Card['boardId']
    title: Card['title']
  }
}

const schema: SchemaOf<CreateCardRequest['body']> = yup.object({
  boardId: yup.string().uuid().required(),
  title: yup.string().required(),
})

export default async function createCard(req: CreateCardRequest, res: NextApiResponse<Card>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const { ownerId } = await prisma.board.findUnique({
      where: { id: body.boardId },
      select: { ownerId: true },
      rejectOnNotFound: true,
    })
    const card = await prisma.card.create({
      data: {
        title: body.title.trim(),
        boardId: body.boardId,
        settings: {},
        ownerId: ownerId,
      }
    })
    return res.status(201).json(card)
  }
}

export async function callCreateCard(body: CreateCardRequest['body']): Promise<Card> {
  const { data } = await axios.post('/api/cards/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
