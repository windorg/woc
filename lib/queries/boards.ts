import { unsafeCanSee } from "lib/access"
import { callCreateBoard, CreateBoardBody } from "pages/api/boards/create"
import { callListBoards, ListBoardsData, ListBoardsQuery } from "pages/api/boards/list"
import { Query, QueryClient, useMutation, useQuery, useQueryClient } from "react-query"

const listBoardsKeyPrefix = 'listBoards'
const listBoardsKey = (query: ListBoardsQuery) => ['listBoards', query]

export async function prefetchBoards(queryClient: QueryClient, query: ListBoardsQuery) {
  await queryClient.prefetchQuery(
    listBoardsKey(query),
    async () => callListBoards(query)
  )
}

export function useBoards(
  query: ListBoardsQuery,
  options?: { initialData?: ListBoardsData }
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
          const [prefix, args] = query.queryKey as [string, ListBoardsQuery]
          return prefix === listBoardsKeyPrefix &&
            (args?.users === undefined || args.users.includes(board.ownerId))
        }
        queryClient.setQueriesData<ListBoardsData | undefined>(
          { predicate },
          listBoardsData => {
            if (listBoardsData === undefined) return listBoardsData
            return [...listBoardsData, board_]
          })
      }
    })
}