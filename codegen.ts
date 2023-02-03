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
    scalars: {
      UUID: 'string',
      DateTime: 'Date',
    },
  },
}

export default config
