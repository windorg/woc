import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditCard } from '@lib/access'
import { removeCardFromParent } from '@lib/parents'
import { Card } from '../../schema/card'
import { GraphQLError } from 'graphql'

export const DeleteCardResult = builder.simpleObject('DeleteCardResult', {
  fields: (t) => ({
    parent: t.field({ type: Card, nullable: true }),
    ownerId: t.field({ type: 'UUID' }),
  }),
})

builder.mutationField('deleteCard', (t) =>
  t.field({
    type: DeleteCardResult,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (root, args, ctx, info) => {
      const card = await prisma.card.findUniqueOrThrow({
        where: { id: args.id },
        include: {
          parent: { select: { ownerId: true, settings: true } },
        },
      })
      if (!canEditCard(ctx.userId, card))
        throw new GraphQLError('You do not have permission to delete this card')
      await prisma.card.delete({
        where: { id: args.id },
      })
      return await prisma.$transaction(async (prisma) => {
        const newParent =
          card.parentId !== null ? await removeCardFromParent(prisma, card.id, card.parentId) : null
        return { parent: newParent, ownerId: card.ownerId }
      })
    },
  })
)
