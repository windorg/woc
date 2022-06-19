import { Comment } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canEditComment } from 'lib/access'
import { cardSettings } from '@lib/model-settings'
import { addJob } from '@lib/job-queue'

interface DeleteCommentRequest extends NextApiRequest {
  body: {
    commentId: Comment['id']
  }
}

export type DeleteCommentBody = DeleteCommentRequest['body']

const schema: Schema<DeleteCommentBody> = yup.object({
  commentId: yup.string().uuid().required()
})

export default async function deleteComment(req: DeleteCommentRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const comment = await prisma.comment.findUnique({
      where: { id: body.commentId },
      include: {
        card: {
          select: {
            id: true, ownerId: true, settings: true,
            _count: { select: { comments: true } }
          }
        }
      },
      rejectOnNotFound: true,
    })
    if (!canEditComment(session?.userId ?? null, comment)) return res.status(403)

    await prisma.comment.delete({
      where: { id: body.commentId }
    })

    if (cardSettings(comment.card).beeminderGoal) {
      await addJob('beeminder-sync-card', {
        cardId: comment.card.id,
        timestamp: Date.now(),
        commentCount: comment.card._count.comments - 1,
      })
    }

    return res.status(204).send()
  }
}
