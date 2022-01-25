import { User } from "@prisma/client"
import { callGetUser, GetUserResponse } from "pages/api/users/get"
import { QueryClient, useMutation, useQuery, useQueryClient } from "react-query"

const getUserKey = (props: { userId: User['id'] }) => ['getUser', props]

export async function prefetchUser(queryClient: QueryClient, props: { userId: User['id'] }) {
  await queryClient.prefetchQuery(
    getUserKey(props),
    async () => callGetUser(props)
  )
}

// TODO: give a choice between autoupdating and not
//
// TODO: we'd also probably like to use the normal react-query mechanism for signalling errors,
// instead of carrying around the error branch of GetBoardResponse
export function useUser(
  props: { userId: User['id'] },
  options?: { initialData?: GetUserResponse }
) {
  const query = useQuery(
    getUserKey(props),
    async () => callGetUser(props),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
  return query
}
