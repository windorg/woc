import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditCard } from '@lib/access'
import { cardSettings, CommentSettings } from '@lib/model-settings'
import { GraphQLError } from 'graphql'
import { addJob } from '@lib/job-queue'
import { Visibility as BackendVisibility } from '@lib/model-settings'

builder.mutationField('createComment', (t) =>
  t.prismaField({
    type: 'Comment',
    args: {
      cardId: t.arg({ type: 'UUID', required: true }),
      content: t.arg.string({ required: true }),
      private: t.arg.boolean({ required: false }),
    },
    resolve: async (query, root, args, ctx, info) => {
      if (!ctx.userId) throw new GraphQLError('You must be logged in to create a comment')
      const card = await prisma.card.findUniqueOrThrow({
        where: { id: args.cardId },
        select: { id: true, ownerId: true, settings: true, _count: { select: { comments: true } } },
      })
      if (!canEditCard(ctx.userId, card))
        throw new GraphQLError('You do not have permission to comment on this card')
      const comment = await prisma.comment.create({
        data: {
          content: args.content,
          cardId: args.cardId,
          ownerId: card.ownerId,
          settings: {
            visibility: args.private ? BackendVisibility.Private : BackendVisibility.Public,
          } satisfies Partial<CommentSettings>,
        },
      })
      if (cardSettings(card).beeminderGoal) {
        await addJob('beeminder-sync-card', {
          cardId: card.id,
          timestamp: Date.now(),
          commentCount: card._count.comments + 1,
        })
      }
      return comment
    },
  })
)
