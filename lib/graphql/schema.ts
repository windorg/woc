import { builder } from './builder'

import './schema/user'
import './schema/card'

import './queries/user'

import './mutations/card/create'
import './mutations/card/delete'
import './mutations/card/move'
import './mutations/card/update'
import './mutations/card/reorder'

builder.queryType({})
builder.mutationType({})

export const schema = builder.toSchema()
