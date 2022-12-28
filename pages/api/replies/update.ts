import type { Prisma } from '@prisma/client'
import { Reply } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { getSession } from 'next-auth/react'
import { canEditReply } from 'lib/access'
import { ReplySettings } from 'lib/model-settings'

interface UpdateReplyRequest extends NextApiRequest {
  body: {
    replyId: Reply['id']
    content?: Reply['content'] // Markdown
    private?: boolean
  }
}

export type UpdateReplyBody = UpdateReplyRequest['body']

const schema: Schema<UpdateReplyBody> = yup.object({
  replyId: yup.string().uuid().required(),
  content: yup.string(),
  private: yup.boolean(),
})

// Returns only the updated fields (the 'settings' field is always returned in full)
//
// TODO here and in general we shouldn't return the complete 'settings' object because it might contain things we don't
// want to expose. Instead we should have a different view type for replies, with settings embedded.
export default async function updateReply(req: UpdateReplyRequest, res: NextApiResponse<Partial<Reply>>) {
  if (req.method === 'PUT') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const reply = await prisma.reply.findUnique({
      where: { id: body.replyId },
      include: {
        comment: {
          select: {
            ownerId: true,
            settings: true,
            card: {
              select: {
                ownerId: true,
                settings: true,
              },
            },
          },
        },
      },
      rejectOnNotFound: true,
    })
    if (!canEditReply(session?.userId ?? null, reply)) return res.status(403)

    let diff: Partial<Reply> & { settings: Partial<ReplySettings> } = {
      settings: reply.settings ?? {},
    }
    if (body.content !== undefined) {
      diff.content = body.content
    }
    if (body.private !== undefined) {
      diff.settings.visibility = body.private ? 'private' : 'public'
    }
    await prisma.reply.update({
      where: { id: body.replyId },
      // See https://github.com/prisma/prisma/issues/9247
      data: diff as unknown as Prisma.InputJsonObject,
    })
    // If we ever have "updatedAt", we should also return it here

    return res.status(200).json(diff)
  }
}
