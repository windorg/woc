import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditComment } from '@lib/access'
import { cardSettings, CommentSettings } from '@lib/model-settings'
import { GraphQLError } from 'graphql'
import { addJob } from '@lib/job-queue'
import { Card } from '../../schema/card'

export const DeleteCommentResult = builder.simpleObject('DeleteCommentResult', {
  fields: (t) => ({
    card: t.field({ type: Card }),
  }),
})

builder.mutationField('deleteComment', (t) =>
  t.field({
    type: DeleteCommentResult,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (root, args, ctx, info) => {
      const comment = await prisma.comment.findUniqueOrThrow({
        where: { id: args.id },
        include: {
          card: {
            include: { _count: { select: { comments: true } } },
          },
        },
      })
      if (!canEditComment(ctx.userId, comment))
        throw new GraphQLError('You do not have permission to delete this comment')
      await prisma.comment.delete({
        where: { id: args.id },
      })
      if (cardSettings(comment.card).beeminderGoal) {
        await addJob('beeminder-sync-card', {
          cardId: comment.card.id,
          timestamp: Date.now(),
          commentCount: comment.card._count.comments - 1,
        })
      }
      return {
        card: {
          ...comment.card,
          _count: { ...comment.card._count, comments: comment.card._count.comments - 1 },
        },
      }
    },
  })
)
