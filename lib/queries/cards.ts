import { Card } from "@prisma/client"
import { unsafeCanSee } from "lib/access"
import { callGetCard, GetCardData, GetCardQuery } from "pages/api/cards/get"
import { callUpdateCard, UpdateCardBody } from "pages/api/cards/update"
import { callCreateCard, CreateCardBody } from "pages/api/cards/create"
import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import { GetBoardData } from "pages/api/boards/get"
import { fromGetBoardKey, getBoardKey } from "./boards"
import { callDeleteCard, DeleteCardBody } from "pages/api/cards/delete"
import { keyPredicate, updateQueriesData, updateQueryData } from "./util"
import { deleteById } from "lib/array"

// Keys

export const getCardKey = (query: GetCardQuery) => ['getCard', query]
export const fromGetCardKey = (key: QueryKey) => key[0] === 'getCard' ? key[1] as GetCardQuery : null

// Prefetches

export async function prefetchCard(queryClient: QueryClient, query: GetCardQuery) {
  await queryClient.prefetchQuery(
    getCardKey(query),
    async () => callGetCard(query)
  )
}

// Queries

export function useCard(
  query: GetCardQuery,
  options?: { initialData?: GetCardData }
) {
  return useQuery(
    getCardKey(query),
    async () => callGetCard(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
}

// Mutations

export function useUpdateCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: UpdateCardBody) => { return callUpdateCard(data) },
    {
      onSuccess: (updates, variables) => {
        // Update the GetCard query
        updateQueryData<GetCardData>(
          queryClient,
          getCardKey({ cardId: variables.cardId }),
          getCardData => ({ ...getCardData, ...updates })
        )
        // TODO: when we have ListCards, update here as well
      }
    })
}

export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: CreateCardBody) => { return callCreateCard(data) },
    {
      onSuccess: (card, variables) => {
        // TODO: go through ListCards as well when we have it
        const card_ = unsafeCanSee({ ...card, _count: { comments: 0 } })
        updateQueryData<GetBoardData>(
          queryClient,
          getBoardKey({ boardId: variables.boardId }),
          getBoardData => ({
            ...getBoardData,
            cards: [...getBoardData.cards, card_]
          })
        )
      }
    })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: DeleteCardBody) => { return callDeleteCard(data) },
    {
      onSuccess: (_void, variables) => {
        // Update the GetCard query
        queryClient.removeQueries(getCardKey({ cardId: variables.cardId }), { exact: true })
        // TODO: go through ListCards as well when we have it
        updateQueriesData<GetBoardData>(
          queryClient,
          { predicate: keyPredicate(fromGetBoardKey, query => true) },
          getBoardData => ({
            ...getBoardData,
            cards: deleteById(getBoardData.cards, variables.cardId)
          })
        )
      }
    })
}