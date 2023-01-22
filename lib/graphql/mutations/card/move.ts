import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditCard } from '@lib/access'
import { addCardToParent, getCardChain, removeCardFromParent } from '@lib/parents'
import { Card } from '../../schema/card'
import { GraphQLError } from 'graphql'

export const MoveCardResult = builder.simpleObject('MoveCardResult', {
  fields: (t) => ({
    card: t.field({ type: Card }),
    oldParent: t.field({ type: Card, nullable: true }),
    newParent: t.field({ type: Card, nullable: true }),
  }),
})

builder.mutationField('moveCard', (t) =>
  t.field({
    type: MoveCardResult,
    args: {
      id: t.arg({ type: 'UUID', required: true }),
      newParentId: t.arg({ type: 'UUID', required: false }),
    },
    resolve: async (root, args, ctx, info) => {
      // TODO: I suppose I can use the 'include' setting of Pothos instead of this
      const card = await prisma.card.findUniqueOrThrow({
        where: { id: args.id },
        include: {
          parent: { select: { ownerId: true, settings: true } },
        },
      })
      if (!canEditCard(ctx.userId, card))
        throw new GraphQLError('You do not have permission to move this card')
      return await prisma.$transaction(async (prisma) => {
        // Extra checks only if we're moving into non-null
        if (args.newParentId) {
          const newParent = await prisma.card.findUnique({ where: { id: args.newParentId } })
          if (!newParent) throw new GraphQLError('Parent not found')
          if (!canEditCard(ctx.userId, newParent))
            throw new GraphQLError('You do not have permission to move this card into this parent')
          if ((await getCardChain(prisma, args.newParentId)).includes(card.id))
            throw new GraphQLError('Cannot move card into one of its own children')
        }
        // Move the actual card
        const newCard = await prisma.card.update({
          where: { id: args.id },
          data: { parentId: args.newParentId || null },
        })
        const oldParent = card.parentId
          ? await removeCardFromParent(prisma, card.id, card.parentId)
          : null
        const newParent = args.newParentId
          ? await addCardToParent(prisma, card.id, args.newParentId)
          : null
        return {
          card: newCard,
          oldParent,
          newParent,
        }
      })
    },
  })
)
