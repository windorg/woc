import { callFollowUser, FollowUserBody } from "pages/api/users/follow"
import { callGetUser, GetUserData, GetUserQuery } from "pages/api/users/get"
import { callUnfollowUser, UnfollowUserBody } from "pages/api/users/unfollow"
import { Query, QueryClient, useMutation, useQuery, useQueryClient } from "react-query"

const getUserKeyPrefix = 'getUser'
const getUserKey = (query: GetUserQuery) => ['getUser', query]

export async function prefetchUser(queryClient: QueryClient, query: GetUserQuery) {
  await queryClient.prefetchQuery(
    getUserKey(query),
    async () => callGetUser(query)
  )
}

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

export function useFollowUser() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: FollowUserBody) => { return callFollowUser(data) },
    {
      onSuccess: (response, { userId }) => {
        const predicate = (query: Query) => {
          const [prefix, args] = query.queryKey as [string, GetUserQuery]
          return prefix === getUserKeyPrefix && args.userId === userId
        }
        queryClient.setQueriesData<GetUserData | undefined>(
          { predicate },
          getUserData => {
            if (!getUserData) return getUserData
            return { ...getUserData, followed: true }
          })
      }
    })
}

export function useUnfollowUser() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: UnfollowUserBody) => { return callUnfollowUser(data) },
    {
      onSuccess: (response, { userId }) => {
        const predicate = (query: Query) => {
          const [prefix, args] = query.queryKey as [string, GetUserQuery]
          return prefix === getUserKeyPrefix && args.userId === userId
        }
        queryClient.setQueriesData<GetUserData | undefined>(
          { predicate },
          getUserData => {
            if (!getUserData) return getUserData
            return { ...getUserData, followed: false }
          })
      }
    })
}