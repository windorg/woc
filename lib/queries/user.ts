import { FollowUserBody } from 'pages/api/users/follow'
import { GetUserData, GetUserQuery } from 'pages/api/users/get'
import { UnfollowUserBody } from 'pages/api/users/unfollow'
import { Query, QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from 'react-query'
import { keyPredicate, updateQueriesData } from './util'
import { callFollowUser, callGetUser, callUnfollowUser } from '@lib/api'

// Keys

export const getUserKey = (query: GetUserQuery) => ['getUser', query]
export const fromGetUserKey = (key: QueryKey) => (key[0] === 'getUser' ? (key[1] as GetUserQuery) : null)

// Queries

export function useUser(query: GetUserQuery, options?: { initialData?: GetUserData }) {
  return useQuery(getUserKey(query), async () => callGetUser(query), {
    cacheTime: Infinity,
    staleTime: Infinity,
    initialData: options?.initialData,
  })
}

// Mutations

export function useFollowUser() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: FollowUserBody) => {
      return callFollowUser(data)
    },
    {
      onSuccess: (response, { userId }) => {
        updateQueriesData<GetUserData>(
          queryClient,
          {
            predicate: keyPredicate(fromGetUserKey, (query) => query.userId === userId),
          },
          (getUserData) => ({ ...getUserData, followed: true })
        )
      },
    }
  )
}

export function useUnfollowUser() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: UnfollowUserBody) => {
      return callUnfollowUser(data)
    },
    {
      onSuccess: (response, { userId }) => {
        updateQueriesData<GetUserData>(
          queryClient,
          {
            predicate: keyPredicate(fromGetUserKey, (query) => query.userId === userId),
          },
          (getUserData) => ({ ...getUserData, followed: false })
        )
      },
    }
  )
}
