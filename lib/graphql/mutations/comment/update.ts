import { builder } from '../../builder'
import { Comment } from '../../schema/comment'
import { prisma } from '@lib/db'
import { canEditComment } from '@lib/access'
import { Comment as PrismaComment } from '@prisma/client'
import { CommentSettings } from '@lib/model-settings'
import { GraphQLError } from 'graphql'
import _ from 'lodash'
import { Visibility } from '@lib/graphql/schema/visibility'

export const UpdateCommentInput = builder.inputType('UpdateCommentInput', {
  fields: (t) => ({
    id: t.field({ type: 'UUID', required: true }),
    content: t.string(),
    private: t.boolean(),
    pinned: t.boolean(),
  }),
})

export const UpdateCommentResult = builder.simpleObject('UpdateCommentResult', {
  fields: (t) => ({
    comment: t.field({ type: Comment }),
  }),
})

builder.mutationField('updateComment', (t) =>
  t.field({
    type: UpdateCommentResult,
    args: {
      input: t.arg({ type: UpdateCommentInput, required: true }),
    },
    resolve: async (root, { input }, ctx, info) => {
      const comment = await prisma.comment.findUniqueOrThrow({
        where: { id: input.id },
      })
      if (!canEditComment(ctx.userId, comment))
        throw new GraphQLError('You do not have permission to edit this comment')

      let diff: Partial<PrismaComment> & { settings: Partial<CommentSettings> } = {
        settings: comment.settings ?? {},
      }
      if (!_.isNil(input.content)) {
        diff.content = input.content
      }
      if (!_.isNil(input.private)) {
        diff.settings.visibility = input.private ? Visibility.Private : Visibility.Public
      }
      if (!_.isNil(input.pinned)) {
        diff.settings.pinned = input.pinned
      }
      const newComment = await prisma.comment.update({
        where: { id: input.id },
        data: diff,
      })

      return {
        comment: newComment,
      }
    },
  })
)
