import { Comment } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditComment } from 'lib/access'
import { CommentSettings } from 'lib/model-settings'
import _ from 'lodash'

interface UpdateCommentRequest extends NextApiRequest {
  body: {
    commentId: Comment['id']
    content?: Comment['content'] // Markdown
    private?: boolean
    pinned?: boolean
  }
}

export type UpdateCommentBody = UpdateCommentRequest['body']

const schema: Schema<UpdateCommentBody> = yup.object({
  commentId: yup.string().uuid().required(),
  content: yup.string(),
  private: yup.boolean(),
  pinned: yup.boolean()
})

// Returns only the updated fields (the 'settings' field is always returned in full)
//
// TODO here and in general we shouldn't return the complete 'settings' object because it might contain things we don't
// want to expose. Instead we should have a different view type for comments, with settings embedded.
export default async function updateComment(req: UpdateCommentRequest, res: NextApiResponse<Partial<Comment>>) {
  if (req.method === 'PUT') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const comment = await prisma.comment.findUnique({
      where: { id: body.commentId },
      include: {
        card: {
          select: {
            ownerId: true, settings: true,
          }
        }
      },
      rejectOnNotFound: true,
    })
    if (!canEditComment(session?.userId ?? null, comment)) return res.status(403)

    let diff: Partial<Comment> & { settings: Partial<CommentSettings> } = {
      settings: comment.settings ?? {}
    }
    if (body.content !== undefined) {
      diff.content = body.content
    }
    if (body.pinned !== undefined) {
      diff.settings.pinned = body.pinned
    }
    if (body.private !== undefined) {
      diff.settings.visibility = (body.private ? "private" : "public")
    }
    await prisma.comment.update({
      where: { id: body.commentId },
      // See https://github.com/prisma/prisma/issues/9247
      data: (diff as unknown) as Prisma.InputJsonObject
    })
    // If we ever have "updatedAt", we should also return it here

    return res.status(200).json(diff)
  }
}

export async function callUpdateComment(body: UpdateCommentBody): Promise<Partial<Comment>> {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_APP_URL!}/api/comments/update`, body)
  return wocResponse(data)
}
