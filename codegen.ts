import type { CodegenConfig } from '@graphql-codegen/cli'
import { printSchema } from 'graphql'
import { schema } from '@lib/graphql/schema'

const config: CodegenConfig = {
  schema: printSchema(schema),
  documents: ['{components,lib,pages}/**/!(*.graphql).{ts,tsx}'],
  generates: {
    './generated/graphql/': {
      preset: 'client',
      plugins: [],
    },
  },
}

export default config
