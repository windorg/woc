import type { CodegenConfig } from '@graphql-codegen/cli'
import { printSchema } from 'graphql'
import { schema } from '@lib/graphql/schema'

const config: CodegenConfig = {
  schema: printSchema(schema),
  documents: ['{components,lib,pages}/**/*.{ts,tsx}'],
  generates: {
    './generated/graphql/': {
      preset: 'client',
      plugins: [],
    },
    './generated/schema.graphql': {
      plugins: ['schema-ast'],
    },
  },
  config: {
    avoidOptionals: {
      field: true,
      inputValue: false,
      object: true,
      defaultValue: true,
    },
    scalars: {
      UUID: 'string',
      // Doesn't work properly due to https://github.com/apollographql/apollo-client/issues/8857
      // DateTime: 'Date',
      DateTime: 'string',
    },
  },
}

export default config
