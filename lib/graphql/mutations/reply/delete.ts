import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canDeleteReply } from '@lib/access'
import { GraphQLError } from 'graphql'
import { Comment } from '../../schema/comment'

export const DeleteReplyResult = builder.simpleObject('DeleteReplyResult', {
  fields: (t) => ({
    comment: t.field({ type: Comment }),
  }),
})

builder.mutationField('deleteReply', (t) =>
  t.field({
    type: DeleteReplyResult,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (root, args, ctx, info) => {
      // Check if the user can delete the reply
      const reply = await prisma.reply.findUniqueOrThrow({
        where: { id: args.id },
        include: { comment: true },
      })
      if (!canDeleteReply(ctx.userId, reply))
        throw new GraphQLError('You do not have permission to delete this reply')

      // Delete the reply
      await prisma.reply.delete({ where: { id: args.id } })

      return { comment: reply.comment }
    },
  })
)
