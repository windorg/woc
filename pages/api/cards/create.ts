import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { canEditBoard } from 'lib/access'
import { getSession } from 'next-auth/react'

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
    const session = await getSession({ req })
    const board = await prisma.board.findUnique({
      where: { id: body.boardId },
      select: { ownerId: true, settings: true },
      rejectOnNotFound: true,
    })
    if (!await canEditBoard(session?.userId, board)) return res.status(403)
    const card = await prisma.card.create({
      data: {
        title: body.title.trim(),
        boardId: body.boardId,
        settings: {},
        ownerId: board.ownerId,
      }
    })
    return res.status(201).json(card)
  }
}

export async function callCreateCard(body: CreateCardRequest['body']): Promise<Card> {
  const { data } = await axios.post('/api/cards/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
