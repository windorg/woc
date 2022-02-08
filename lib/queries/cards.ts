import { Card } from "@prisma/client"
import { unsafeCanSee } from "lib/access"
import { callGetCard, GetCardData, GetCardQuery } from "pages/api/cards/get"
import { callUpdateCard, UpdateCardBody } from "pages/api/cards/update"
import { callCreateCard, CreateCardBody } from "pages/api/cards/create"
import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import { callDeleteCard, DeleteCardBody } from "pages/api/cards/delete"
import { keyPredicate, updateQueriesData, updateQueryData } from "./util"
import { deleteById, mergeById } from "lib/array"
import { callListCards, ListCardsData, ListCardsQuery } from "pages/api/cards/list"
import { callMoveCard, MoveCardBody } from "pages/api/cards/move"

// Keys

export const getCardKey = (query: GetCardQuery) => ['getCard', query]
export const fromGetCardKey = (key: QueryKey) => key[0] === 'getCard' ? key[1] as GetCardQuery : null

export const listCardsKey = (query: ListCardsQuery) => ['listCards', query]
export const fromListCardsKey = (key: QueryKey) => key[0] === 'listCards' ? key[1] as ListCardsQuery : null

// Prefetches

export async function prefetchCard(queryClient: QueryClient, query: GetCardQuery) {
  await queryClient.prefetchQuery(
    getCardKey(query),
    async () => callGetCard(query)
  )
}

export async function prefetchCards(queryClient: QueryClient, query: ListCardsQuery) {
  await queryClient.prefetchQuery(
    listCardsKey(query),
    async () => callListCards(query)
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

export function useCards(
  query: ListCardsQuery,
  options?: { initialData?: ListCardsData }
) {
  return useQuery(
    listCardsKey(query),
    async () => callListCards(query),
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
        // Update the ListCards queries
        updateQueriesData<ListCardsData>(
          queryClient,
          { predicate: keyPredicate(fromListCardsKey, query => true) },
          listCardsData => mergeById(listCardsData, unsafeCanSee({ ...updates, id: variables.cardId }))
        )
      }
    })
}

export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: CreateCardBody) => { return callCreateCard(data) },
    {
      onSuccess: (card, variables) => {
        // Update the ListCards queries
        const card_ = unsafeCanSee({ ...card, _count: { comments: 0 } })
        updateQueriesData<ListCardsData>(
          queryClient,
          { predicate: keyPredicate(fromListCardsKey, query => query.boards.includes(card.boardId)) },
          listCardsData => [...listCardsData, card_]
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
        // Update the ListCards queries
        updateQueriesData<ListCardsData>(
          queryClient,
          { predicate: keyPredicate(fromListCardsKey, query => true) },
          listCardsData => deleteById(listCardsData, variables.cardId)
        )
      }
    })
}

export function useMoveCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: MoveCardBody) => { return callMoveCard(data) },
    {
      onSuccess: (_void, variables) => {
        // Update the GetCard query. We don't necessarily have the target board's title etc, so we can't update the card.board field. Instead we just
        // clear the query entirely.
        queryClient.removeQueries(
          getCardKey({ cardId: variables.cardId }),
          { exact: true }
        )
        // Update the ListCards queries: remove the card from all boards & invalidate the queries that include the target board. (Regarding the latter
        // part — a better way would be to find the card data and insert it into the target board queries, but it's a bit hard.)
        updateQueriesData<ListCardsData>(
          queryClient,
          { predicate: keyPredicate(fromListCardsKey, query => true) },
          listCardsData => deleteById(listCardsData, variables.cardId)
        )
        queryClient.removeQueries(
          { predicate: keyPredicate(fromListCardsKey, query => query.boards.includes(variables.boardId)) },
        )
      }
    })
}