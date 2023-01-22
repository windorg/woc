import { builder } from './builder'

import './schema/user'
import './schema/card'
import './schema/comment'

import './queries/user'

import './mutations/card/create'
import './mutations/card/delete'
import './mutations/card/move'
import './mutations/card/update'
import './mutations/card/reorder'

import './mutations/comment/create'
import './mutations/comment/delete'
import './mutations/comment/update'

builder.queryType({})
builder.mutationType({})

export const schema = builder.toSchema()
