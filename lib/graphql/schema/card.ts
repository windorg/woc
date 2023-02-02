import { builder } from '../builder'
import { Comment } from './comment'
import { prisma } from '@lib/db'
import endent from 'endent'
import { cardSettings } from '@lib/model-settings'
import { canEditCard, canSeeCard, canSeeComment } from '@lib/access'
import { getCardChain } from '@lib/parents'
import { filterAsync } from '@lib/array'
import { GraphQLError } from 'graphql'
import { Visibility } from './visibility'

export const Card = builder.prismaObject('Card', {
  authScopes: async (parent, context) => {
    return canSeeCard(context.userId, parent)
  },
  fields: (t) => ({
    id: t.expose('id', { type: 'UUID' }),
    title: t.exposeString('title'),
    tagline: t.exposeString('tagline'),
    parentId: t.expose('parentId', { type: 'UUID', nullable: true }),
    ownerId: t.expose('ownerId', { type: 'UUID' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    childrenOrder: t.field({
      type: ['UUID'],
      resolve: async (card, args, context) => {
        return filterAsync(card.childrenOrder, async (id) =>
          canSeeCard(context.userId, { id, ownerId: card.ownerId })
        )
      },
    }),
    parent: t.relation('parent'),
    owner: t.relation('owner'),
    children: t.prismaField({
      type: ['Card'],
      description: endent`
        Subcards of this card.
        
        Note: not necessarily in the right order! You have to order them using \`childrenOrder\`.
      `,
      select: (args, ctx, nestedSelection) => ({ children: nestedSelection(true) }),
      resolve: async (query, card, args, context) => {
        return filterAsync(card.children, async (card) => canSeeCard(context.userId, card))
      },
    }),
    comments: t.prismaField({
      type: ['Comment'],
      select: (args, ctx, nestedSelection) => ({ comments: nestedSelection(true) }),
      resolve: async (query, card, args, context) => {
        return filterAsync(card.comments, async (comment) => canSeeComment(context.userId, comment))
      },
    }),
    commentCount: t.relationCount('comments', {
      description: endent`
        Number of comments on this card.

        Note: this is a count of *all* comments, not just the ones visible to the current user.
      `,
    }),

    parentChain: t.field({
      type: ['UUID'],
      description: endent`
        IDs of all cards in the parent chain (first = toplevel), will be \`[]\` if \`parent === null\`
      `,
      resolve: async (card, args, context) => {
        return card.parentId
          ? await prisma.$transaction(async (prisma) => getCardChain(prisma, card.parentId!))
          : []
      },
    }),

    canEdit: t.boolean({
      description: endent`
        Whether the current user can edit this card.
      `,
      resolve: async (card, args, context) => {
        return canEditCard(context.userId, card)
      },
    }),

    visibility: t.field({
      type: Visibility,
      resolve: (card, args, context) => cardSettings(card).visibility,
    }),
    reverseOrder: t.boolean({
      description: endent`
        Whether to show updates from oldest to newest
      `,
      resolve: (card, args, context) => cardSettings(card).reverseOrder,
    }),
    archived: t.boolean({
      resolve: (card, args, context) => cardSettings(card).archived,
    }),
    beeminderGoal: t.string({
      nullable: true,
      description: endent`
        Beeminder goal to sync with (goal name in the current user's connected Beeminder account).

        Can't be queried unless you have edit access to the card.
      `,
      resolve: async (card, args, context) => {
        if (!(await canEditCard(context.userId, card)))
          throw new GraphQLError('You do not have permission to access `beeminderGoal`')
        return cardSettings(card).beeminderGoal
      },
    }),
  }),
})

builder.queryField('card', (t) =>
  t.prismaField({
    type: Card,
    description: endent`
      Find a card by ID.
      
      Throws an error if the card was not found.
    `,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (query, root, args, ctx, info) => {
      const card = await prisma.card.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      })
      // TODO: we might not need this thanks to authScopes
      if (!(await canSeeCard(ctx.userId, card)))
        throw new GraphQLError('You do not have permission to access this card')
      return card
    },
  })
)

builder.queryField('topLevelCards', (t) =>
  t.prismaField({
    type: [Card],
    description: endent`
      List all visible top-level cards.
    `,
    resolve: async (query, root, args, ctx, info) => {
      const cards = await prisma.card.findMany({
        ...query,
        where: { parentId: null },
      })
      return filterAsync(cards, async (card) => canSeeCard(ctx.userId, card))
    },
  })
)
