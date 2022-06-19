import { Card } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import { CardSettings } from 'lib/model-settings'
import _ from 'lodash'
import { addJob } from '@lib/job-queue'

export type UpdateCardBody = {
  cardId: Card['id']
  title?: Card['title']
  tagline?: Card['tagline']
  private?: boolean
  reverseOrder?: boolean
  archived?: boolean
  beeminderGoal?: CardSettings['beeminderGoal']
}

const schema: Schema<UpdateCardBody> = yup.object({
  cardId: yup.string().uuid().required(),
  title: yup.string(),
  tagline: yup.string(),
  private: yup.boolean(),
  reverseOrder: yup.boolean(),
  archived: yup.boolean(),
  beeminderGoal: yup.string().nullable(),
})

// Returns only the updated fields (the 'settings' field is always returned in full)
//
// TODO here and in general we shouldn't return the complete 'settings' object because it might contain things we don't
// want to expose. Instead we should have a different view type for cards, with settings embedded.
export default async function updateCard(req: NextApiRequest, res: NextApiResponse<Partial<Card>>) {
  if (req.method === 'PUT') {
    const session = await getSession({ req })
    const body = schema.cast(req.body)
    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      include: {
        _count: { select: { comments: true } },
      },
      rejectOnNotFound: true,
    })
    if (!canEditCard(session?.userId ?? null, card)) return res.status(403)

    let diff: Partial<Card> & { settings: Partial<CardSettings> } = {
      settings: card.settings ?? {}
    }
    if (body.title !== undefined) {
      diff.title = body.title
    }
    if (body.tagline !== undefined) {
      diff.tagline = body.tagline
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
    if (body.beeminderGoal !== undefined) {
      diff.settings.beeminderGoal = body.beeminderGoal
    }
    await prisma.card.update({
      where: { id: body.cardId },
      // See https://github.com/prisma/prisma/issues/9247
      data: (diff as unknown) as Prisma.InputJsonObject
    })

    if (diff.settings.beeminderGoal) {
      await addJob('beeminder-sync-card', {
        cardId: card.id,
        timestamp: Date.now(),
        commentCount: card._count.comments,
      })
    }
    // If we ever have "updatedAt", we should also return it here

    return res.status(200).json(diff)
  }
}
