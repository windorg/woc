import { Query, QueryClient, QueryKey, notifyManager } from 'react-query'
import { QueryFilters } from 'react-query/types/core/utils'

export function keyPredicate<T>(from: (key: QueryKey) => T | null, fn: (query: T) => boolean): (q: Query) => boolean {
  return (q) => {
    const query = from(q.queryKey)
    return query !== null && fn(query)
  }
}

// Like setQueryData, but doesn't allow 'undefined'. Will do nothing if the query does not exist in the cache.
export function updateQueryData<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (oldData: TData) => TData
) {
  // TODO: should cancel queries that are being fetched
  const data = queryClient.getQueryData(queryKey)
  if (data !== undefined) {
    queryClient.setQueryData<TData>(queryKey, updater as (oldData: TData | undefined) => TData)
  }
}

// Like setQueriesData, but doesn't allow 'undefined'.
export function updateQueriesData<TData>(
  queryClient: QueryClient,
  queryFilters: QueryFilters,
  updater: (oldData: TData) => TData
) {
  // TODO: should cancel queries that are being fetched
  return notifyManager.batch(() =>
    queryClient
      .getQueryCache()
      .findAll(queryFilters)
      .flatMap(({ queryKey, state }) =>
        state.data !== undefined
          ? [queryKey, queryClient.setQueryData<TData>(queryKey, updater as (oldData: TData | undefined) => TData)]
          : []
      )
  )
}
