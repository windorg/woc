import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditCard } from '@lib/access'
import { Card } from '../../schema/card'
import { GraphQLError } from 'graphql'
import { reorderCardChildren } from '@lib/reorderCardChildren'

export const FireCardResult = builder.simpleObject('FireCardResult', {
  fields: (t) => ({
    card: t.field({ type: Card }),
    // We include the parent so that the client can have the new `childrenOrder`
    parent: t.field({ type: Card, nullable: true }),
  }),
})

builder.mutationField('fireCard', (t) =>
  t.field({
    type: FireCardResult,
    args: {
      id: t.arg({ type: 'UUID', required: true }),
    },
    resolve: async (root, args, ctx, info) => {
      const card = await prisma.card.findUniqueOrThrow({
        where: { id: args.id },
        include: { parent: true },
      })
      if (!canEditCard(ctx.userId, card))
        throw new GraphQLError('You do not have permission to edit this card')
      return await prisma.$transaction(async (prisma) => {
        // Update the card itself
        const newCard = await prisma.card.update({
          where: { id: args.id },
          data: { firedAt: new Date() },
        })
        // Put the card first in the children's list
        let newParent = card.parent
        if (card.parentId) {
          const { childrenOrder } = await prisma.card.findUniqueOrThrow({
            where: { id: card.parentId },
            select: { childrenOrder: true },
          })
          const newChildrenOrder = reorderCardChildren(
            { id: card.parentId, childId: card.id, position: 0 },
            childrenOrder,
            (err) => {
              throw new GraphQLError(err)
            }
          )
          newParent = await prisma.card.update({
            where: { id: card.parentId },
            data: { childrenOrder: newChildrenOrder },
          })
        }
        return { card: newCard, parent: newParent }
      })
    },
  })
)
