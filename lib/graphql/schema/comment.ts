import { builder } from '../builder'
import { prisma } from '@lib/db'
import endent from 'endent'
import { CommentSettings, commentSettings } from '@lib/model-settings'
import { canEditComment, canSeeComment } from '@lib/access'
import { filterAsync, filterSync } from '@lib/array'
import { GraphQLError } from 'graphql'

export const Comment = builder.prismaObject('Comment', {
  authScopes: async (parent, context) => {
    return canSeeComment(context.userId, parent)
  },
  fields: (t) => ({
    id: t.expose('id', { type: 'UUID' }),
    content: t.exposeString('content', {
      description: endent`
        The content of the comment, as Markdown.
      `,
    }),
    cardId: t.expose('cardId', { type: 'UUID' }),
    ownerId: t.expose('ownerId', { type: 'UUID' }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),

    card: t.relation('card', {
      description: endent`
        The card this comment is attached to.
      `,
    }),

    canEdit: t.boolean({
      description: endent`
        Whether the current user can edit this comment.
      `,
      resolve: async (parent, args, context) => {
        return canEditComment(context.userId, parent)
      },
    }),

    visibility: t.string({
      resolve: (parent, args, context) => commentSettings(parent).visibility,
    }),
    pinned: t.boolean({
      description: endent`
        Whether the comment is pinned. Several comments can be pinned in the same card.
      `,
      resolve: (parent, args, context) => commentSettings(parent).pinned,
    }),
  }),
})
