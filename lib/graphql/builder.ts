import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects'
import ScopeAuthPlugin from '@pothos/plugin-scope-auth'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { prisma } from '@lib/db'
import { DateTimeResolver, UUIDResolver } from 'graphql-scalars'
import { GraphQLError } from 'graphql'

export const builder = new SchemaBuilder<{
  Context: {
    userId: string | null
  }
  AuthScopes: Record<string, never>
  PrismaTypes: PrismaTypes
  Scalars: {
    UUID: {
      Input: string
      Output: string
    }
    DateTime: {
      Input: Date
      Output: Date
    }
  }
}>({
  plugins: [ScopeAuthPlugin, SimpleObjectsPlugin, PrismaPlugin],
  authScopes: async (context) => ({}),
  scopeAuthOptions: {
    unauthorizedError: (parent, context, info, result) => new GraphQLError(result.message),
  },
  prisma: {
    client: prisma,
    // Use /// comments from Prisma (which we don't have yet) as descriptions
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
  },
})

builder.addScalarType('UUID', UUIDResolver, {})
builder.addScalarType('DateTime', DateTimeResolver, {})
