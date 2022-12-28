import { Comment } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import { cardSettings, CommentSettings } from 'lib/model-settings'
import { addJob } from '@lib/job-queue'

interface CreateCommentRequest extends NextApiRequest {
  body: {
    cardId: Comment['cardId']
    content: Comment['content'] // Markdown
    private?: boolean
  }
}

export type CreateCommentBody = CreateCommentRequest['body']

const schema: Schema<CreateCommentBody> = yup.object({
  cardId: yup.string().uuid().required(),
  content: yup.string().required(),
  private: yup.boolean(),
})

export type Comment_ = Comment & { canEdit: boolean }

export default async function createComment(req: CreateCommentRequest, res: NextApiResponse<Comment_>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      select: {
        id: true,
        ownerId: true,
        settings: true,
        _count: { select: { comments: true } },
      },
      rejectOnNotFound: true,
    })
    if (!canEditCard(session?.userId ?? null, card)) return res.status(403)
    const settings: Partial<CommentSettings> = {
      visibility: body.private ? 'private' : 'public',
    }
    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        cardId: body.cardId,
        settings,
        ownerId: card.ownerId,
      },
    })
    if (cardSettings(card).beeminderGoal) {
      await addJob('beeminder-sync-card', {
        cardId: card.id,
        timestamp: Date.now(),
        commentCount: card._count.comments + 1,
      })
    }
    return res.status(201).json({ ...comment, canEdit: true })
  }
}
