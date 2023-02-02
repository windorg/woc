import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canReplyToComment } from '@lib/access'
import { commentSettings, CommentSettings, ReplySettings } from '@lib/model-settings'
import { GraphQLError } from 'graphql'
import { subscription_update_kind, User, Comment } from '@prisma/client'
import { deleteSync } from '@lib/array'

builder.mutationField('createReply', (t) =>
  t.prismaField({
    type: 'Reply',
    args: {
      commentId: t.arg({ type: 'UUID', required: true }),
      content: t.arg.string({ required: true }),
      // private: t.arg.boolean({ required: false }),
    },

    resolve: async (query, root, args, ctx, info) => {
      // Check if the user is logged in
      if (!ctx.userId) throw new GraphQLError('You must be logged in to leave a reply')

      // Check if the user has permission to reply to the comment
      const comment = await prisma.comment.findUniqueOrThrow({
        where: { id: args.commentId },
        select: { id: true, ownerId: true, settings: true },
      })
      if (!(await canReplyToComment(ctx.userId, comment)))
        throw new GraphQLError('You do not have permission to reply to this comment')

      // Create the reply
      const reply = await prisma.reply.create({
        data: {
          content: args.content,
          commentId: args.commentId,
          authorId: ctx.userId,
          settings: {} satisfies Partial<ReplySettings>,
        },
      })

      // Subscribe the replier to the thread
      let currentSubscribers = commentSettings(comment).subscribers
      if (ctx.userId !== comment.ownerId)
        currentSubscribers = await setUserSubscription(ctx.userId, args.commentId, 'subscribe')
      currentSubscribers.push(comment.ownerId)

      // Notify all current subscribers
      for (const subscriber of currentSubscribers) {
        const subscriberExists = (await prisma.user.count({ where: { id: subscriber } })) > 0
        if (!subscriberExists) {
          // If the subscriber doesn't exist anymore, i.e. the user was deleted, we will remove them from the subscribers list. This is so that we don't have to do any extensive bookkeeping operations when a user is deleted — instead we unsubscribe dead users on demand.
          await setUserSubscription(ctx.userId, args.commentId, 'unsubscribe')
        } else {
          // Otherwise we create a notification in their inbox.
          if (subscriber !== ctx.userId) {
            await prisma.subscriptionUpdate.create({
              data: {
                subscriberId: subscriber,
                updateKind: subscription_update_kind.suk_reply,
                // TODO: not sure why we fill both cardUpdateId and replyId
                commentId: args.commentId,
                replyId: reply.id,
              },
            })
          }
        }
      }

      return reply
    },
  })
)

/**
 * Subscribe or unsubscribe a user to the reply thread of the comment.
 *
 * @returns The list of current subscribers.
 */
async function setUserSubscription(
  userId: User['id'],
  commentId: Comment['id'],
  action: 'subscribe' | 'unsubscribe'
): Promise<User['id'][]> {
  return await prisma.$transaction(async (prisma) => {
    const settings = commentSettings(
      await prisma.comment.findUniqueOrThrow({
        where: { id: commentId },
        select: { settings: true },
      })
    )
    const needsUpdate: boolean =
      action === 'subscribe'
        ? !settings.subscribers.includes(userId)
        : settings.subscribers.includes(userId)
    if (!needsUpdate) {
      return settings.subscribers
    } else {
      const newSubscribers =
        action === 'subscribe'
          ? settings.subscribers.concat([userId])
          : deleteSync(settings.subscribers, userId)
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          settings: { ...settings, subscribers: newSubscribers } satisfies CommentSettings,
        },
      })
      return newSubscribers
    }
  })
}
