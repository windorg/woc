import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { wocResponse } from 'lib/http'
import { canEditBoard } from 'lib/access'
import { getSession } from 'next-auth/react'
import { CardSettings } from 'lib/model-settings'

interface CreateCardRequest extends NextApiRequest {
  body: {
    boardId: Card['boardId']
    title: Card['title']
    private?: boolean
  }
}

export type CreateCardBody = CreateCardRequest['body']

const schema: Schema<CreateCardBody> = yup.object({
  boardId: yup.string().uuid().required(),
  title: yup.string().required(),
  private: yup.boolean()
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
    if (!canEditBoard(session?.userId ?? null, board)) return res.status(403)
    const settings: Partial<CardSettings> = {
      visibility: body.private ? 'private' : 'public'
    }
    const card = await prisma.card.create({
      data: {
        title: body.title.trim(),
        boardId: body.boardId,
        settings,
        ownerId: board.ownerId,
      }
    })
    await prisma.$transaction(async prisma => {
      const { cardOrder } = await prisma.board.findUnique({
        where: { id: body.boardId },
        select: { cardOrder: true },
        rejectOnNotFound: true,
      })
      await prisma.board.update({
        where: { id: body.boardId },
        data: { cardOrder: [card.id, ...cardOrder] },
      })
    })
    return res.status(201).json(card)
  }
}

export async function callCreateCard(body: CreateCardBody): Promise<Card> {
  const { data } = await axios.post('/api/cards/create', body)
  return wocResponse(data)
}
