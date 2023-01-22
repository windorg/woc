import { canSeeCard } from '@lib/access'
import { filterAsync } from '@lib/array'
import { prisma } from '@lib/db'
import endent from 'endent'
import { builder } from '../builder'
import { Card } from '../schema/card'
import { User } from '../schema/user'

// Add queries for getting cards owned by a user.
builder.prismaObjectFields(User, (t) => ({
  allCards: t.prismaField({
    type: [Card],
    description: endent`
      All cards owned by this user, including subcards.
    `,
    resolve: async (query, parent, args, context) => {
      const cards = await prisma.card.findMany({
        ...query,
        where: { ownerId: parent.id },
      })
      return filterAsync(cards, async (card) => canSeeCard(context.userId, card))
    },
  }),
  topLevelCards: t.prismaField({
    type: [Card],
    description: endent`
      Cards that are directly owned by this user.
    `,
    resolve: async (query, parent, args, context) => {
      const cards = await prisma.card.findMany({
        ...query,
        where: { ownerId: parent.id, parentId: null },
      })
      return filterAsync(cards, async (card) => canSeeCard(context.userId, card))
    },
  }),
}))
