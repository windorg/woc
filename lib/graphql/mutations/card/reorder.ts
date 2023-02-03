import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditCard } from '@lib/access'
import { Card } from '../../schema/card'
import _ from 'lodash'
import endent from 'endent'
import { GraphQLError } from 'graphql'
import { reorderCardChildren } from '@lib/reorderCardChildren'

export const ReorderCardChildrenInput = builder.inputType('ReorderCardChildrenInput', {
  description: endent`
    The input for the \`reorderCardChildren\` mutation.

    Exactly one of \`position\`, \`before\`, or \`after\` must be provided.
  `,
  fields: (t) => ({
    id: t.field({ type: 'UUID', required: true }),
    childId: t.field({ type: 'UUID', required: true }),
    position: t.int({
      description: 'The new index that the card should have in the board',
    }),
    before: t.field({
      type: 'UUID',
      description: 'The card that the `childId` card should be moved before',
    }),
    after: t.field({
      type: 'UUID',
      description: 'The card that the `childId` card should be moved after',
    }),
  }),
})

export const ReorderCardChildrenResult = builder.simpleObject('ReorderCardChildrenResult', {
  fields: (t) => ({
    card: t.field({ type: Card }),
  }),
})

builder.mutationField('reorderCardChildren', (t) =>
  t.field({
    type: ReorderCardChildrenResult,
    args: {
      input: t.arg({ type: ReorderCardChildrenInput, required: true }),
    },
    resolve: async (root, { input }, ctx, info) => {
      const card = await prisma.card.findUniqueOrThrow({
        where: { id: input.id },
      })
      if (!canEditCard(ctx.userId, card))
        throw new GraphQLError('You do not have permission to edit this card')
      return await prisma.$transaction(async (prisma) => {
        const { childrenOrder } = await prisma.card.findUniqueOrThrow({
          where: { id: input.id },
          select: { childrenOrder: true },
        })
        const newChildrenOrder = reorderCardChildren(input, childrenOrder, (err) => {
          throw new GraphQLError(err)
        })
        const newCard = await prisma.card.update({
          where: { id: input.id },
          data: { childrenOrder: newChildrenOrder },
        })
        return { card: newCard }
      })
    },
  })
)
