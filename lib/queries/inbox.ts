import { deleteById } from "lib/array"
import { callInboxCount, InboxCountResponse } from "pages/api/inbox/count"
import { callGetInbox, GetInboxData, GetInboxQuery } from "pages/api/inbox/get"
import { callMarkAsRead, MarkAsReadBody } from "pages/api/inbox/mark-as-read"
import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import { keyPredicate, updateQueriesData } from "./util"

// Keys

export const getInboxKey = (query: GetInboxQuery) => ['getInbox', query]
export const fromGetInboxKey = (key: QueryKey) => key[0] === 'getInbox' ? key[1] as GetInboxQuery : null

export const getInboxCountKey = (query: Record<string, never>) => ['getInboxCount', query]
export const fromGetInboxCountKey = (key: QueryKey) => key[0] === 'getInboxCount' ? key[1] as Record<string, never> : null

// Prefetches

export async function prefetchInbox(queryClient: QueryClient, query: GetInboxQuery) {
  await queryClient.prefetchQuery(
    getInboxKey(query),
    async () => callGetInbox(query)
  )
}

// Queries

export function useInbox(
  query: GetInboxQuery,
  options?: { initialData?: GetInboxData }
) {
  return useQuery(
    getInboxKey(query),
    async () => callGetInbox(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
}

export function useInboxCount(
  options?: { refetchInterval?: number }
) {
  const query = useQuery(
    getInboxCountKey({}),
    async () => callInboxCount(),
    {
      staleTime: Infinity,
      refetchInterval: options?.refetchInterval,
    }
  )
  return query
}

// Mutations

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: MarkAsReadBody) => { return callMarkAsRead(data) },
    {
      onSuccess: (data, variables) => {
        updateQueriesData<GetInboxData>(
          queryClient,
          { predicate: keyPredicate(fromGetInboxKey, query => true) },
          getInboxData => deleteById(getInboxData, variables.subscriptionUpdateId)
        )
        updateQueriesData<InboxCountResponse>(
          queryClient,
          { predicate: keyPredicate(fromGetInboxCountKey, query => true) },
          inboxCountResponse => ({ itemCount: inboxCountResponse.itemCount - 1 })
        )
      }
    })
}
