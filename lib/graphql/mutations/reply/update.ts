import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { canEditReply } from '@lib/access'
import { Reply as PrismaReply } from '@prisma/client'
import { ReplySettings } from '@lib/model-settings'
import { GraphQLError } from 'graphql'
import _ from 'lodash'
import { Reply } from '@lib/graphql/schema/reply'

export const UpdateReplyInput = builder.inputType('UpdateReplyInput', {
  fields: (t) => ({
    id: t.field({ type: 'UUID', required: true }),
    content: t.string(),
    // private: t.boolean(),
  }),
})

export const UpdateReplyResult = builder.simpleObject('UpdateReplyResult', {
  fields: (t) => ({
    reply: t.field({ type: Reply }),
  }),
})

builder.mutationField('updateReply', (t) =>
  t.field({
    type: UpdateReplyResult,
    args: {
      input: t.arg({ type: UpdateReplyInput, required: true }),
    },
    resolve: async (root, { input }, ctx, info) => {
      const reply = await prisma.reply.findUniqueOrThrow({
        where: { id: input.id },
      })
      if (!canEditReply(ctx.userId, reply))
        throw new GraphQLError('You do not have permission to edit this reply')

      let diff: Partial<PrismaReply> & { settings: Partial<ReplySettings> } = {
        settings: reply.settings ?? {},
      }
      if (!_.isNil(input.content)) {
        diff.content = input.content
      }
      // if (!_.isNil(input.private)) {
      //   diff.settings.visibility = input.private ? 'private' : 'public'
      // }
      const newReply = await prisma.reply.update({
        where: { id: input.id },
        data: diff,
      })

      return {
        reply: newReply,
      }
    },
  })
)
