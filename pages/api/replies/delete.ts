import { Reply } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canDeleteReply } from 'lib/access'

interface DeleteReplyRequest extends NextApiRequest {
  body: {
    replyId: Reply['id']
  }
}

export type DeleteReplyBody = DeleteReplyRequest['body']

const schema: Schema<DeleteReplyBody> = yup.object({
  replyId: yup.string().uuid().required()
})

export default async function deleteReply(req: DeleteReplyRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const reply = await prisma.reply.findUnique({
      where: { id: body.replyId },
      include: {
        comment: {
          select: {
            ownerId: true, settings: true,
            card: {
              select: {
                ownerId: true, settings: true,
                board: { select: { ownerId: true, settings: true } }
              }
            }
          }
        }
      },
      rejectOnNotFound: true,
    })
    if (!canDeleteReply(session?.userId ?? null, reply)) return res.status(403)

    await prisma.reply.delete({
      where: { id: body.replyId }
    })

    return res.status(204).send()
  }
}

export async function callDeleteReply(body: DeleteReplyBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/replies/delete`, body)
}
