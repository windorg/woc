/** GraphQL API entrypoint */

import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL } from 'graphql-helix'
import { NextApiHandler } from 'next/types'
import { schema } from '@lib/graphql/schema'
import { getSession } from 'next-auth/react'

export default (async (req, res) => {
  const request = {
    body: req.body as object,
    headers: req.headers,
    method: req.method!,
    query: req.query,
  }

  if (shouldRenderGraphiQL(request)) {
    res.send(renderGraphiQL({ endpoint: '/api/graphql' }))
  } else {
    const { operationName, query, variables } = getGraphQLParameters(request)

    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
      contextFactory: async () => {
        const session = await getSession({ req })
        return { userId: session?.userId }
      },
    })

    void sendResult(result, res)
  }
}) as NextApiHandler
