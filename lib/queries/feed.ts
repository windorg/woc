import { GetFeedData, GetFeedQuery } from "pages/api/feed/get"
import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import {callGetFeed} from "@lib/api";

// Keys

export const getFeedKey = (query: GetFeedQuery) => ['getFeed', query]
export const fromGetFeedKey = (key: QueryKey) => key[0] === 'getFeed' ? key[1] as GetFeedQuery : null

// Prefetches

export async function prefetchFeed(queryClient: QueryClient, query: GetFeedQuery) {
  await queryClient.prefetchQuery(
    getFeedKey(query),
    async () => callGetFeed(query)
  )
}

// Queries

export function useFeed(
  query: GetFeedQuery,
  options?: { initialData?: GetFeedData }
) {
  return useQuery(
    getFeedKey(query),
    async () => callGetFeed(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
}
