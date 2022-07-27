import { GetCardData, GetCardQuery, GetCardResponse } from "pages/api/cards/get"
import { UpdateCardBody } from "pages/api/cards/update"
import {
  callCreateCard,
  callDeleteCard,
  callGetCard,
  callListCards,
  callMoveCard,
  callReorderCards,
  callUpdateCard
} from '@lib/api'
import { CreateCardBody } from "pages/api/cards/create"
import { QueryClient, QueryKey, useMutation, useQuery, useQueryClient } from "react-query"
import { DeleteCardBody } from "pages/api/cards/delete"
import { keyPredicate, updateQueriesData, updateQueryData } from "./util"
import { deleteById, filterSync, mergeById } from "lib/array"
import { ListCardsData, ListCardsQuery } from "pages/api/cards/list"
import { MoveCardBody } from "pages/api/cards/move"
import { ReorderCardsBody } from "pages/api/cards/reorderCards"

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
      retry(failureCount, error) {
        if (failureCount > 3) return false
        if (((error as any)?.data as Extract<GetCardResponse, { success: false }>['error'])?.notFound) return false
        return true
      },
    }
  )
}

export function useCards(
  query: ListCardsQuery,
  options?: {
    initialData?: ListCardsData
    enabled?: boolean
  }
) {
  return useQuery(
    listCardsKey(query),
    async () => callListCards(query),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
      enabled: options?.enabled,
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
        // Update the GetCard query for the card itself
        updateQueryData<GetCardData>(
          queryClient,
          getCardKey({ cardId: variables.cardId }),
          getCardData => ({ ...getCardData, ...updates })
        )
        // Update all ListCards queries
        updateQueriesData<ListCardsData>(
          queryClient,
          { predicate: keyPredicate(fromListCardsKey, query => true) },
          listCardsData => mergeById(listCardsData, { ...updates, id: variables.cardId })
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
        // Update the ListCards queries that might want to list this new card
        const card_ = { ...card, _count: { comments: 0 } }
        updateQueriesData<ListCardsData>(
          queryClient,
          {
            predicate: keyPredicate(fromListCardsKey, query =>
              (query.owners === undefined ? true : query.owners.includes(card.ownerId)) &&
              (query.parents === undefined ? true : (card.parentId !== null && query.parents.includes(card.parentId))) &&
              (query.onlyTopLevel ? card.parentId === null : true)
            )
          },
          listCardsData => [...listCardsData, card_]
        )
        // Update the parent card
        if (card.parentId !== null) {
          updateQueryData<GetCardData>(
            queryClient,
            getCardKey({ cardId: card.parentId }),
            getCardData => ({ ...getCardData, childrenOrder: [card.id, ...getCardData.childrenOrder] })
          )
        }
      }
    })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: DeleteCardBody) => { return callDeleteCard(data) },
    {
      onSuccess: (_void, variables) => {
        // Erase the GetCard query for this card
        queryClient.removeQueries(getCardKey({ cardId: variables.cardId }), { exact: true })
        // Update all GetCard queries and remove the card from the list of children. We could update just the parent
        // instead but we don't have info about the parent.
        updateQueriesData<GetCardData>(
          queryClient,
          { predicate: keyPredicate(fromGetCardKey, query => true) },
          getCardData => ({ ...getCardData, childrenOrder: filterSync(getCardData.childrenOrder, id => id !== variables.cardId) })
        )
        // Update all ListCards queries (easy!). Note that cards in ListCards don't include children order so we don't
        // have to do any more changes.
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
        // We can't easily surgically update the GetCard query for the moved card, because we'd have to recalculate its
        // parent chain. We also can't easily surgically update ListCards query (although we could grab the logic from
        // useCreateCard and reuse it here). Instead, we just kill all GetCards and ListCards queries.
        queryClient.removeQueries(getCardKey({ cardId: variables.cardId }), { exact: true })
        queryClient.removeQueries({ predicate: keyPredicate(fromListCardsKey, query => true) })
      }
    })
}

export function useReorderCards() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: ReorderCardsBody) => { return callReorderCards(data) },
    {
      onSuccess: ({ childrenOrder }, variables) => {
        // Update the GetCard query
        updateQueryData<GetCardData>(
          queryClient,
          getCardKey({ cardId: variables.parentId }),
          getCardData => ({ ...getCardData, childrenOrder })
        )
        // NB: we don't need to update the ListCards queries for the parent because they don't include children order
        // anymore.
      }
    })
}
