import { builder } from '../builder'
import { prisma } from '@lib/db'
import endent from 'endent'
import { CommentSettings, commentSettings } from '@lib/model-settings'
import { canEditComment, canSeeComment, canSeeReply } from '@lib/access'
import { filterAsync, filterSync } from '@lib/array'
import { GraphQLError } from 'graphql'
import { Reply } from './reply'
import { Visibility } from './visibility'
import { User } from './user'

export const Comment = builder.prismaObject('Comment', {
  authScopes: async (comment, context) => {
    return canSeeComment(context.userId, comment)
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

    replies: t.field({
      type: [Reply],
      select: { replies: true },
      resolve: async (comment, args, context) => {
        return filterAsync(comment.replies, async (reply) => canSeeReply(context.userId, reply))
      },
    }),

    canEdit: t.boolean({
      description: endent`
        Whether the current user can edit this comment.
      `,
      resolve: async (comment, args, context) => {
        return canEditComment(context.userId, comment)
      },
    }),

    visibility: t.field({
      type: Visibility,
      resolve: (comment, args, context) => commentSettings(comment).visibility,
    }),
    pinned: t.boolean({
      description: endent`
        Whether the comment is pinned. Several comments can be pinned in the same card.
      `,
      resolve: (comment, args, context) => commentSettings(comment).pinned,
    }),
  }),
})
