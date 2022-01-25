import { Comment } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { canEditCard } from 'lib/access'
import { CommentSettings } from 'lib/model-settings'

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
  private: yup.boolean()
})

export default async function createComment(req: CreateCommentRequest, res: NextApiResponse<Comment>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const card = await prisma.card.findUnique({
      where: { id: body.cardId },
      select: {
        ownerId: true,
        settings: true,
        board: { select: { ownerId: true, settings: true } }
      },
      rejectOnNotFound: true,
    })
    if (!await canEditCard(session?.userId ?? null, card)) return res.status(403)
    const settings: Partial<CommentSettings> = {
      visibility: body.private ? 'private' : 'public'
    }
    const comment = await prisma.comment.create({
      data: {
        content: body.content,
        cardId: body.cardId,
        settings,
        ownerId: card.ownerId,
      }
    })
    return res.status(201).json(comment)
  }
}

export async function callCreateComment(body: CreateCommentBody): Promise<Comment> {
  const { data } = await axios.post('/api/comments/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
