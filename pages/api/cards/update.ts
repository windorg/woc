import { Card, Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import { CardSettings } from 'lib/model-settings'
import _ from 'lodash'

interface UpdateCardRequest extends NextApiRequest {
  body: {
    cardId: Card['id']
    title?: Card['title']
    private?: boolean
    reverseOrder?: boolean
    archived?: boolean
  }
}

export type UpdateCardBody = UpdateCardRequest['body']

const schema: Schema<UpdateCardBody> = yup.object({
  cardId: yup.string().uuid().required(),
  title: yup.string(),
  private: yup.boolean(),
  reverseOrder: yup.boolean(),
  archived: yup.boolean(),
})

// Returns only the updated fields (the 'settings' field is always returned in full)
//
// TODO here and in general we shouldn't return the complete 'settings' object because it might contain things we don't
// want to expose. Instead we should have a different view type for cards, with settings embedded.
export default async function updateCard(req: UpdateCardRequest, res: NextApiResponse<Partial<Card>>) {
  if (req.method === 'PUT') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      include: { board: { select: { ownerId: true, settings: true } } },
      rejectOnNotFound: true,
    })
    if (!await canEditCard(session?.userId ?? null, card)) return res.status(403)

    let diff: Partial<Card> & { settings: Partial<CardSettings> } = {
      settings: card.settings ?? {}
    }
    if (body.title !== undefined) {
      diff.title = body.title
    }
    if (body.private !== undefined) {
      diff.settings.visibility = (body.private ? "private" : "public")
    }
    if (body.reverseOrder !== undefined) {
      diff.settings.reverseOrder = body.reverseOrder
    }
    if (body.archived !== undefined) {
      diff.settings.archived = body.archived
    }
    await prisma.card.update({
      where: { id: body.cardId },
      // See https://github.com/prisma/prisma/issues/9247
      data: (diff as unknown) as Prisma.InputJsonObject
    })
    // If we ever have "updatedAt", we should also return it here

    return res.status(200).json(diff)
  }
}

export async function callUpdateCard(body: UpdateCardBody): Promise<Partial<Card>> {
  const { data } = await axios.put('/api/cards/update', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
