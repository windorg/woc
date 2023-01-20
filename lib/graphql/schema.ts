import { builder } from './builder'

import './schema/user'

builder.queryType({})
builder.mutationType({})

export const schema = builder.toSchema()
