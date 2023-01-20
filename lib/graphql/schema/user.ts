import { builder } from '../builder'
import { prisma } from '@lib/db'
import endent from 'endent'
import { userSettings } from '@lib/model-settings'

export const User = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeString('id'),
    handle: t.exposeString('handle'),
    displayName: t.exposeString('displayName'),
    followed: t.boolean({
      description: endent`
        Whether the current user is following this user.
        (Only available if the current user is logged in.)
      `,
      nullable: true,
      resolve: async (parent, args, context) => {
        if (!context.userId) return null
        return follows(context.userId, parent.id)
      },
    }),
  }),
})

export const CurrentUser = builder.prismaObject('User', {
  variant: 'CurrentUser',
  fields: (t) => ({
    id: t.exposeString('id'),
    handle: t.exposeString('handle'),
    displayName: t.exposeString('displayName'),
    email: t.exposeString('email'),
    beeminderUsername: t.string({
      nullable: true,
      select: { settings: true },
      resolve: (parent) => userSettings(parent).beeminderUsername,
    }),
    // beeminderAccessToken is not exposed on purpose — it's a secret
  }),
})

builder.queryField('user', (t) =>
  t.prismaField({
    type: User,
    description: endent`
      Find a user by ID.
      
      Throws an error if the user was not found.
      
      This query will only return fields that are always available publicly. If you need to fetch the logged-in user's data, use \`currentUser\`.
    `,
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, root, args, ctx, info) =>
      prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: args.id },
      }),
  })
)

builder.queryField('currentUser', (t) =>
  t.prismaField({
    type: CurrentUser,
    description: endent`
      Get the currently logged-in user.
      
      Throws an error if the user is not logged in.
    `,
    resolve: async (query, root, args, ctx, info) => {
      if (ctx.userId === null) throw new Error('Not logged in')
      return prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: ctx.userId },
      })
    },
  })
)

builder.mutationField('followUser', (t) =>
  t.prismaField({
    type: User,
    description: endent`
      Follow a user.
    `,
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, root, args, ctx, info) => {
      if (ctx.userId === null) throw new Error('Not logged in')
      if (ctx.userId === args.id) throw new Error('Cannot follow yourself')
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
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, root, args, ctx, info) => {
      if (ctx.userId === null) throw new Error('Not logged in')
      if (ctx.userId === args.id) throw new Error('Cannot unfollow yourself')
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
