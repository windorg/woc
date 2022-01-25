import { unsafeCanSee } from "lib/access"
import { callCreateBoard, CreateBoardBody } from "pages/api/boards/create"
import { callListBoards, ListBoardsQuery, ListBoardsResponse } from "pages/api/boards/list"
import { Query, QueryClient, useMutation, useQuery, useQueryClient } from "react-query"

const listBoardsKeyPrefix = 'listBoards'
const listBoardsKey = (query: ListBoardsQuery) => ['listBoards', query]

export async function prefetchBoards(queryClient: QueryClient, query: ListBoardsQuery) {
  await queryClient.prefetchQuery(
    listBoardsKey(query),
    async () => callListBoards(query)
  )
}

// TODO: give a choice between autoupdating and not
//
// TODO: we'd also probably like to use the normal react-query mechanism for signalling errors,
// instead of carrying around the error branch of GetBoardResponse
export function useBoards(
  query: ListBoardsQuery,
  options?: { initialData?: ListBoardsResponse }
) {
  return useQuery(
    listBoardsKey(query),
    async () => callListBoards(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: CreateBoardBody) => { return callCreateBoard(data) },
    {
      onSuccess: (board, variables) => {
        const board_ = unsafeCanSee(board)
        // There might be several queries listing boards. We need to update all those queries.
        const predicate = (query: Query) => {
          const key = query.queryKey
          const prefix = key[0]
          const args = key[1] as ListBoardsQuery
          return prefix === listBoardsKeyPrefix &&
            (args?.users === undefined || args.users.includes(board.ownerId))
        }
        queryClient.setQueriesData<ListBoardsResponse | undefined>(
          { predicate },
          listBoardsResponse => {
            if (!listBoardsResponse || !listBoardsResponse.success) return listBoardsResponse
            return {
              ...listBoardsResponse,
              data: [...listBoardsResponse.data, board_]
            }
          })
      }
    })
}