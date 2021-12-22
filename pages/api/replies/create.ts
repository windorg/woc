import { Prisma, Reply, User, Comment, subscription_update_kind } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { canDeleteReply, canEditReply, canReplyToComment } from 'lib/access'
import { CommentSettings, commentSettings, ReplySettings } from 'lib/model-settings'
import * as R from 'ramda'

interface CreateReplyRequest extends NextApiRequest {
  body: {
    commentId: Reply['commentId']
    content: Reply['content'] // Markdown
    // private?: boolean
  }
}

export type CreateReplyBody = CreateReplyRequest['body']

const schema: SchemaOf<CreateReplyBody> = yup.object({
  commentId: yup.string().uuid().required(),
  content: yup.string().required(),
  // private: yup.boolean()
})

// An augmented reply type that we return from the API
export type ReplyResponse = Reply & {
  author: Pick<User, 'id' | 'email' | 'displayName'>
  canEdit: boolean
  canDelete: boolean
}

// Subscribe or unsubscribe a user to the reply thread of the comment, and return the current subscribers
async function setUserSubscription(
  userId: User['id'],
  commentId: Comment['id'],
  action: 'subscribe' | 'unsubscribe'
): Promise<User['id'][]> {
  return await prisma.$transaction(async prisma => {
    const settings = commentSettings(
      await prisma.comment.findUnique({
        where: { id: commentId },
        select: { settings: true },
        rejectOnNotFound: true,
      }))
    const needsUpdate: boolean =
      action === 'subscribe'
        ? !R.includes(userId, settings.subscribers)
        : R.includes(userId, settings.subscribers)
    if (!needsUpdate) {
      return settings.subscribers
    } else {
      const newSubscribers =
        action === 'subscribe'
          ? settings.subscribers.concat([userId])
          : R.filter(x => x !== userId, settings.subscribers)
      const newSettings: CommentSettings = {
        ...settings,
        subscribers: newSubscribers
      }
      await prisma.comment.update({
        where: { id: commentId },
        data: { settings: (newSettings as unknown) as Prisma.InputJsonValue }
      })
      return newSubscribers
    }
  })
}

export default async function createReply(req: CreateReplyRequest, res: NextApiResponse<ReplyResponse>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const comment = await prisma.comment.findUnique({
      where: { id: body.commentId },
      select: {
        ownerId: true, settings: true,
        card: {
          select: {
            ownerId: true, settings: true,
            board: { select: { ownerId: true, settings: true } }
          }
        }
      },
      rejectOnNotFound: true,
    })
    if (!session) return res.status(403)
    if (!await canReplyToComment(session?.userId, comment)) return res.status(403)

    // Create the reply
    const reply = await prisma.reply.create({
      data: {
        content: body.content,
        commentId: body.commentId,
        settings: {},
        authorId: session.userId,
      }
    })

    const replyAugmented = {
      ...reply,
      author: await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, displayName: true, email: true },
        rejectOnNotFound: true
      }),
      canEdit: await canEditReply(session.userId, { ...reply, comment }),
      canDelete: await canDeleteReply(session.userId, { ...reply, comment })
    }

    // Subscribe the replier to the thread
    let currentSubscribers = commentSettings(comment).subscribers
    if (session.userId !== comment.ownerId) {
      currentSubscribers = await setUserSubscription(session.userId, body.commentId, 'subscribe')
    }

    // Notify all current subscribers
    for (const subscriber of currentSubscribers) {
      const subscriberExists = (await prisma.user.count({ where: { id: subscriber } })) > 0
      if (!subscriberExists) {
        // If the subscriber doesn't exist anymore, i.e. the user was deleted, we will remove them from the subscribers
        // list. This is so that we don't have to do any extensive bookkeeping operations when a user is deleted —
        // instead we unsubscribe dead users on demand.
        await setUserSubscription(session.userId, body.commentId, 'unsubscribe')
      } else {
        // Otherwise we create a notification in their inbox.
        if (subscriber !== session.userId) {
          await prisma.subscriptionUpdate.create({
            data: {
              subscriberId: subscriber,
              updateKind: subscription_update_kind.suk_reply,
              // TODO: not sure why we fill both cardUpdateId and replyId
              commentId: body.commentId,
              replyId: reply.id,
            }
          })
        }
      }
    }

    return res.status(201).json(replyAugmented)
  }
}

export async function callCreateReply(body: CreateReplyBody): Promise<ReplyResponse> {
  const { data } = await axios.post('/api/replies/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
