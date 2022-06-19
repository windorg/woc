import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { wocResponse } from 'lib/http'
import { canEditCard } from 'lib/access'
import { getSession } from 'next-auth/react'
import { CardSettings } from 'lib/model-settings'

interface CreateCardRequest extends NextApiRequest {
  body: {
    parentId: Card['id']
    title: Card['title']
    private?: boolean
  }
}

export type CreateCardBody = CreateCardRequest['body']

const schema: Schema<CreateCardBody> = yup.object({
  parentId: yup.string().uuid().required(),
  title: yup.string().required(),
  private: yup.boolean()
})

export default async function createCard(req: CreateCardRequest, res: NextApiResponse<Card>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const board = await prisma.card.findUnique({
      where: { id: body.parentId },
      select: { id: true, ownerId: true, settings: true },
      rejectOnNotFound: true,
    })
    if (!canEditCard(session?.userId ?? null, board)) return res.status(403)
    const settings: Partial<CardSettings> = {
      visibility: body.private ? 'private' : 'public'
    }
    const card = await prisma.card.create({
      data: {
        type: 'Card',
        title: body.title.trim(),
        parentId: body.parentId,
        settings,
        ownerId: board.ownerId,
      }
    })
    await prisma.$transaction(async prisma => {
      const { childrenOrder } = await prisma.card.findUnique({
        where: { id: body.parentId },
        select: { childrenOrder: true },
        rejectOnNotFound: true,
      })
      await prisma.card.update({
        where: { id: body.parentId },
        data: { childrenOrder: [card.id, ...childrenOrder] },
      })
    })
    return res.status(201).json(card)
  }
}

export async function callCreateCard(body: CreateCardBody): Promise<Card & { parentId: string }> {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/create`, body)
  return wocResponse(data)
}
