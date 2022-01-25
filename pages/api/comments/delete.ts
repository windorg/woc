import { Comment } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canEditComment } from 'lib/access'

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
            ownerId: true, settings: true,
            board: { select: { ownerId: true, settings: true } }
          }
        }
      },
      rejectOnNotFound: true,
    })
    if (!await canEditComment(session?.userId ?? null, comment)) return res.status(403)

    await prisma.comment.delete({
      where: { id: body.commentId }
    })

    return res.status(204).send()
  }
}

export async function callDeleteComment(body: DeleteCommentBody): Promise<void> {
  await axios.post('/api/comments/delete', body)
}
