import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
// import ScopeAuthPlugin from '@pothos/plugin-scope-auth'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { prisma } from '@lib/db'
import { UUIDResolver } from 'graphql-scalars'

export const builder = new SchemaBuilder<{
  Context: {
    userId: string | null
  }
  // AuthScopes: {
  //   public: boolean // Available to everyone
  //   loggedIn: boolean // Available to authenticated users
  // }
  PrismaTypes: PrismaTypes
  Scalars: {
    UUID: {
      Input: string
      Output: string
    }
  }
}>({
  plugins: [
    // ScopeAuthPlugin,
    PrismaPlugin,
  ],
  // authScopes: async (context) => ({
  //   public: true,
  //   loggedIn: !!context.userId,
  // }),
  prisma: {
    client: prisma,
    // Use /// comments from Prisma (which we don't have yet) as descriptions
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
  },
})

builder.addScalarType('UUID', UUIDResolver, {})
