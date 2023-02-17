import { builder } from './builder'

import './schema/visibility'
import './schema/user'
import './schema/card'
import './schema/comment'
import './schema/reply'

import './queries/user'

import './mutations/user/update'

import './mutations/card/create'
import './mutations/card/delete'
import './mutations/card/move'
import './mutations/card/update'
import './mutations/card/reorder'
import './mutations/card/fire'

import './mutations/comment/create'
import './mutations/comment/delete'
import './mutations/comment/update'

import './mutations/reply/create'
import './mutations/reply/delete'
import './mutations/reply/update'

builder.queryType({})
builder.mutationType({})

export const schema = builder.toSchema()
