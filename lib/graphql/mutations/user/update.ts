import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { User as PrismaUser } from '@prisma/client'
import { User } from '../../schema/user'
import { UserSettings } from '@lib/model-settings'
import _ from 'lodash'
import { GraphQLError } from 'graphql'

export const UpdateUserInput = builder.inputType('UpdateUserInput', {
  fields: (t) => ({
    id: t.field({ type: 'UUID', required: true }),
    betaAccess: t.boolean(),
  }),
})

export const UpdateUserResult = builder.simpleObject('UpdateUserResult', {
  fields: (t) => ({
    user: t.field({ type: User }),
  }),
})

builder.mutationField('updateUser', (t) =>
  t.field({
    type: UpdateUserResult,
    args: {
      input: t.arg({ type: UpdateUserInput, required: true }),
    },
    resolve: async (root, { input }, ctx, info) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: input.id },
      })
      if (user.id !== ctx.userId)
        throw new GraphQLError('You do not have permission to edit this user')

      let diff: Partial<PrismaUser> & { settings: Partial<UserSettings> } = {
        settings: user.settings ?? {},
      }
      if (!_.isNil(input.betaAccess)) {
        diff.settings.betaAccess = input.betaAccess
      }
      const newUser = await prisma.user.update({
        where: { id: input.id },
        data: diff,
      })

      return {
        user: newUser,
      }
    },
  })
)
