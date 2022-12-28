import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { canEditCard } from 'lib/access'
import { getSession } from 'next-auth/react'
import { CardSettings } from 'lib/model-settings'

interface CreateCardRequest extends NextApiRequest {
  body: {
    parentId: Card['id'] | null // if null, we create a board
    title: Card['title']
    private?: boolean
  }
}

export type CreateCardBody = CreateCardRequest['body']

const schema: Schema<CreateCardBody> = yup.object({
  parentId: yup.string().uuid().required().nullable(),
  title: yup.string().required(),
  private: yup.boolean(),
})

export default async function createCard(req: CreateCardRequest, res: NextApiResponse<Card>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    // TODO all 403s etc must end with send() otherwise they aren't sent
    if (!session) return res.status(403)
    const parent = body.parentId
      ? await prisma.card.findUnique({
          where: { id: body.parentId },
          select: { id: true, ownerId: true, settings: true },
          rejectOnNotFound: true,
        })
      : null
    if (parent && !canEditCard(session?.userId ?? null, parent)) return res.status(403)
    const settings: Partial<CardSettings> = {
      visibility: body.private ? 'private' : 'public',
    }
    const card = await prisma.card.create({
      data: {
        title: body.title.trim(),
        parentId: body.parentId,
        settings,
        ownerId: parent ? parent.ownerId : session?.userId,
      },
    })
    await prisma.$transaction(async (prisma) => {
      if (body.parentId) {
        const { childrenOrder } = await prisma.card.findUnique({
          where: { id: body.parentId },
          select: { childrenOrder: true },
          rejectOnNotFound: true,
        })
        await prisma.card.update({
          where: { id: body.parentId },
          data: { childrenOrder: [card.id, ...childrenOrder] },
        })
      }
    })
    return res.status(201).json(card)
  }
}
