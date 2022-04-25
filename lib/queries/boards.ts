import { unsafeCanSee } from "lib/access"
import { deleteById, mergeById } from "lib/array"
import { callCreateBoard, CreateBoardBody } from "pages/api/boards/create"
import { callDeleteBoard, DeleteBoardBody } from "pages/api/boards/delete"
import { callGetBoard, GetBoardData, GetBoardQuery } from "pages/api/boards/get"
import { callListBoards, ListBoardsData, ListBoardsQuery } from "pages/api/boards/list"
import { callReorderCards, ReorderCardsBody } from "pages/api/boards/reorderCards"
import { UpdateBoardBody, callUpdateBoard } from "pages/api/boards/update"
import { Query, QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import { keyPredicate, updateQueriesData, updateQueryData } from "./util"

// Keys

export const getBoardKey = (query: GetBoardQuery) => ['getBoard', query]
export const fromGetBoardKey = (key: QueryKey) => key[0] === 'getBoard' ? key[1] as GetBoardQuery : null

export const listBoardsKey = (query: ListBoardsQuery) => ['listBoards', query]
export const fromListBoardsKey = (key: QueryKey) => key[0] === 'listBoards' ? key[1] as ListBoardsQuery : null

// Prefetches

export async function prefetchBoard(queryClient: QueryClient, query: GetBoardQuery) {
  await queryClient.prefetchQuery(
    getBoardKey(query),
    async () => callGetBoard(query)
  )
}

export async function prefetchBoards(queryClient: QueryClient, query: ListBoardsQuery) {
  await queryClient.prefetchQuery(
    listBoardsKey(query),
    async () => callListBoards(query)
  )
}

// Queries

export function useBoard(
  query: GetBoardQuery,
  options?: { initialData?: GetBoardData }
) {
  return useQuery(
    getBoardKey({ boardId: query.boardId }),
    async () => callGetBoard({ boardId: query.boardId }),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
}

export function useBoards(
  query: ListBoardsQuery,
  options?: {
    initialData?: ListBoardsData
    enabled?: boolean
  }
) {
  return useQuery(
    listBoardsKey(query),
    async () => callListBoards(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
      enabled: options?.enabled,
    }
  )
}

// Mutations

export function useCreateBoard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: CreateBoardBody) => { return callCreateBoard(data) },
    {
      onSuccess: (board, variables) => {
        updateQueriesData<ListBoardsData>(
          queryClient,
          { predicate: keyPredicate(fromListBoardsKey, query => query?.users === undefined || query.users.includes(board.ownerId)) },
          listBoardsData => [...listBoardsData, unsafeCanSee(board)]
        )
      }
    })
}

export function useUpdateBoard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: UpdateBoardBody) => { return callUpdateBoard(data) },
    {
      onSuccess: (updates, variables) => {
        // Update the GetBoard query
        updateQueryData<GetBoardData>(
          queryClient,
          getBoardKey({ boardId: variables.boardId }),
          getBoardData => ({ ...getBoardData, ...updates })
        )
        // Update the ListBoards queries
        updateQueriesData<ListBoardsData>(
          queryClient,
          { predicate: keyPredicate(fromListBoardsKey, query => true) },
          listBoardsData => mergeById(listBoardsData, unsafeCanSee({ ...updates, id: variables.boardId }))
        )
      }
    })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: DeleteBoardBody) => { return callDeleteBoard(data) },
    {
      onSuccess: (_void, variables) => {
        // Update the GetBoard query
        queryClient.removeQueries(getBoardKey({ boardId: variables.boardId }), { exact: true })
        // Update the ListBoards queries
        updateQueriesData<ListBoardsData>(
          queryClient,
          { predicate: keyPredicate(fromListBoardsKey, query => true) },
          listBoardsData => deleteById(listBoardsData, variables.boardId)
        )
      }
    })
}

export function useReorderCards() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: ReorderCardsBody) => { return callReorderCards(data) },
    {
      onSuccess: ({ cardOrder }, variables) => {
        // Update the GetBoard query
        updateQueryData<GetBoardData>(
          queryClient,
          getBoardKey({ boardId: variables.boardId }),
          getBoardData => ({ ...getBoardData, cardOrder })
        )
        // Update the ListBoards queries
        updateQueriesData<ListBoardsData>(
          queryClient,
          { predicate: keyPredicate(fromListBoardsKey, query => true) },
          listBoardsData => mergeById(listBoardsData, unsafeCanSee({ cardOrder, id: variables.boardId }))
        )
      }
    })
}