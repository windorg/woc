import { callFollowUser, FollowUserBody } from "pages/api/users/follow"
import { callGetUser, GetUserData, GetUserQuery } from "pages/api/users/get"
import { callUnfollowUser, UnfollowUserBody } from "pages/api/users/unfollow"
import { Query, QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import { keyPredicate, updateQueriesData } from "./util"

// Keys

export const getUserKey = (query: GetUserQuery) => ['getUser', query]
export const fromGetUserKey = (key: QueryKey) => key[0] === 'getUser' ? key[1] as GetUserQuery : null

// Prefetches

export async function prefetchUser(queryClient: QueryClient, query: GetUserQuery) {
  await queryClient.prefetchQuery(
    getUserKey(query),
    async () => callGetUser(query)
  )
}

// Queries

export function useUser(
  query: GetUserQuery,
  options?: { initialData?: GetUserData }
) {
  return useQuery(
    getUserKey(query),
    async () => callGetUser(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
}

// Mutations

export function useFollowUser() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: FollowUserBody) => { return callFollowUser(data) },
    {
      onSuccess: (response, { userId }) => {
        updateQueriesData<GetUserData>(
          queryClient,
          { predicate: keyPredicate(fromGetUserKey, query => query.userId === userId) },
          getUserData => ({ ...getUserData, followed: true })
        )
      }
    })
}

export function useUnfollowUser() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: UnfollowUserBody) => { return callUnfollowUser(data) },
    {
      onSuccess: (response, { userId }) => {
        updateQueriesData<GetUserData>(
          queryClient,
          { predicate: keyPredicate(fromGetUserKey, query => query.userId === userId) },
          getUserData => ({ ...getUserData, followed: false })
        )
      }
    })
}