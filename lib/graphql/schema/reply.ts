import { builder } from '../builder'
import { prisma } from '@lib/db'
import endent from 'endent'
import { canDeleteReply, canEditReply, canSeeReply } from '@lib/access'
import { replySettings } from '@lib/model-settings'

export const Reply = builder.prismaObject('Reply', {
  authScopes: async (reply, context) => {
    return canSeeReply(context.userId, reply)
  },
  fields: (t) => ({
    id: t.expose('id', { type: 'UUID' }),

    content: t.exposeString('content', {
      description: endent`
        The content of the reply, as Markdown.
      `,
    }),

    commentId: t.expose('commentId', {
      type: 'UUID',
      description: endent`
        The comment this reply is posted on.
      `,
    }),

    authorId: t.expose('authorId', {
      type: 'UUID',
      description: endent`
        The user who posted the reply. Can be \`null\` if the user has been deleted.
      `,
      nullable: true,
    }),

    createdAt: t.expose('createdAt', {
      type: 'DateTime',
    }),

    canEdit: t.boolean({
      description: endent`
        Whether the current user can edit this reply.
      `,
      resolve: async (reply, args, context) => {
        return canEditReply(context.userId, reply)
      },
    }),

    canDelete: t.boolean({
      description: endent`
        Whether the current user can delete this reply.

        Note: since anybody can reply on public comments, comment authors have the ability to delete replies on their comments, regardless of who posted them.
      `,
      select: { comment: { select: { ownerId: true } } },
      resolve: async (reply, args, context) => {
        return canDeleteReply(context.userId, reply)
      },
    }),

    visibility: t.string({
      resolve: (reply, args, context) => replySettings(reply).visibility,
    }),

    author: t.relation('author', {
      description: endent`
        The user who posted the reply. Can be \`undefined\` if the user has been deleted.
      `,
    }),
  }),
})
