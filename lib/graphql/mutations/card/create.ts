import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditCard } from '@lib/access'
import { CardSettings, Visibility as BackendVisibility } from '@lib/model-settings'
import { addCardToParent } from '@lib/parents'
import { GraphQLError } from 'graphql'

builder.mutationField('createCard', (t) =>
  t.prismaField({
    type: 'Card',
    args: {
      title: t.arg.string({ required: true }),
      parentId: t.arg({ type: 'UUID', required: false }),
      private: t.arg.boolean({ required: false }),
    },
    resolve: async (query, root, args, ctx, info) => {
      if (!ctx.userId) throw new GraphQLError('You must be logged in to create a card')
      const parent = args.parentId
        ? await prisma.card.findUniqueOrThrow({
            where: { id: args.parentId },
            select: { id: true, ownerId: true, settings: true },
          })
        : null
      if (parent && !canEditCard(ctx.userId, parent))
        throw new GraphQLError('You do not have permission to create a card in this parent')
      const card = await prisma.card.create({
        data: {
          title: args.title.trim(),
          parentId: args.parentId,
          ownerId: parent ? parent.ownerId : ctx.userId,
          settings: {
            visibility: args.private ? BackendVisibility.Private : BackendVisibility.Public,
          } satisfies Partial<CardSettings>,
        },
      })
      await prisma.$transaction(async (prisma) => {
        if (args.parentId) await addCardToParent(prisma, card.id, args.parentId)
      })
      return card
    },
  })
)