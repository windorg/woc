import { QueryResult } from '@apollo/client'
import _ from 'lodash'
import * as B from 'react-bootstrap'
import { match } from 'ts-pattern'

type QueryData<TQueries> = {
  [K in keyof TQueries]: TQueries[K] extends QueryResult<infer TData, infer _> ? TData : never
}

/**
 * Either render something based on query data, or show a spinner / an error message.
 *
 * NB: This component's primary goal is to ensure we never have to check for `loading` or `error` in a query and muck around with `?` and `!`. It's not to make page loads faster — for that, it's better to use [`@defer`](https://www.apollographql.com/docs/react/data/defer/) (not ready in graphql-codegen as of Jan 2023).
 */
export function Query<TQueries extends Record<string, QueryResult<any, any>>>(props: {
  queries: TQueries
  size?: 'sm' | 'lg'
  children: (data: QueryData<TQueries>) => React.ReactNode
}) {
  const { queries, children } = props
  const size = props.size ?? 'lg'
  const queryResults = Object.values(queries)
  if (queryResults.every((q) => q.data)) {
    return <>{children(_.mapValues(queries, 'data') as QueryData<TQueries>)}</>
  } else if (queryResults.some((q) => q.error)) {
    // TODO: show all errors?
    return <Error error={queryResults.find((q) => q.error)!.error!.message} />
  } else {
    return <Spinner size={size} />
  }
}

function Spinner(props: { size: 'sm' | 'lg' }) {
  return match(props.size)
    .with('sm', () => <B.Spinner animation="border" size="sm" />)
    .with('lg', () => (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    ))
    .exhaustive()
}

function Error(props: { error: string }) {
  return <B.Alert variant="danger">{props.error}</B.Alert>
}
