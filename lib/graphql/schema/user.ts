import { builder } from '../builder'
import { prisma } from '@lib/db'
import endent from 'endent'
import { userSettings } from '@lib/model-settings'
import { GraphQLError } from 'graphql'
import { getUserpicUrl } from '@lib/userpic'

export const User = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.expose('id', { type: 'UUID' }),
    handle: t.exposeString('handle'),
    displayName: t.exposeString('displayName'),
    email: t.exposeString('email', {
      description: endent`
        The user's email address. Only available to the user themselves.
      `,
      authScopes: async (user, args, context) => context.userId === user.id,
    }),
    userpicUrl: t.field({
      type: 'String',
      description: endent`
        A URL pointing to the user's userpic.
      `,
      resolve: (user) => getUserpicUrl(user.email),
    }),
    followed: t.boolean({
      description: endent`
        Whether the currently logged-in user is following this user.
      `,
      nullable: true,
      resolve: async (user, args, context) => {
        if (!context.userId) return null
        return follows(context.userId, user.id)
      },
    }),
    beeminderUsername: t.string({
      description: endent`
        The user's Beeminder username. Only available to the user themselves.
      `,
      authScopes: async (user, args, context) => context.userId === user.id,
      nullable: true,
      resolve: (user) => userSettings(user).beeminderUsername,
    }),
    // beeminderAccessToken is not exposed on purpose — it's a secret
    betaAccess: t.boolean({
      nullable: true,
      description: endent`
        Whether the user can access beta features.

        Only available to the user themselves, returns \`null\` for other users.
      `,
      resolve: async (user, args, context) => {
        if (context.userId !== user.id) return null
        return userSettings(user).betaAccess
      },
    }),
  }),
})

builder.queryField('user', (t) =>
  t.prismaField({
    type: User,
    description: endent`
      Find a user by ID.
      
      Throws an error if the user was not found.
    `,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (query, root, args, ctx, info) =>
      prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      }),
  })
)

// TODO: move to the mutations folder

builder.mutationField('followUser', (t) =>
  t.prismaField({
    type: User,
    description: endent`
      Follow a user.
    `,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (query, root, args, ctx, info) => {
      if (ctx.userId === null) throw new GraphQLError('Not logged in')
      if (ctx.userId === args.id) throw new GraphQLError('Cannot follow yourself')
      if (!(await follows(ctx.userId, args.id))) await follow(ctx.userId, args.id)
      return prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      })
    },
  })
)

builder.mutationField('unfollowUser', (t) =>
  t.prismaField({
    type: User,
    description: endent`
      Unfollow a user.
    `,
    args: { id: t.arg({ type: 'UUID', required: true }) },
    resolve: async (query, root, args, ctx, info) => {
      if (ctx.userId === null) throw new GraphQLError('Not logged in')
      if (ctx.userId === args.id) throw new GraphQLError('Cannot unfollow yourself')
      if (await follows(ctx.userId, args.id)) await unfollow(ctx.userId, args.id)
      return prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      })
    },
  })
)

// Helpers

/** Does one user follow another? */
async function follows(subscriberId: string, followedUserId: string): Promise<boolean> {
  // Apparently Prisma doesn't have "exists": https://github.com/prisma/prisma/issues/5022
  return prisma.followedUser
    .count({
      where: { subscriberId, followedUserId },
    })
    .then(Boolean)
}

/** Make one user follow another. */
async function follow(subscriberId: string, followedUserId: string): Promise<void> {
  await prisma.followedUser.create({
    data: { subscriberId, followedUserId },
  })
}

/** Make one user unfollow another. */
async function unfollow(subscriberId: string, followedUserId: string): Promise<void> {
  await prisma.followedUser.delete({
    where: {
      subscriberId_followedUserId: { subscriberId, followedUserId },
    },
  })
}
