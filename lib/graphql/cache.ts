import { ApolloCache } from '@apollo/client'
import { match, P } from 'ts-pattern'

/**
 * Evict all queries that fetch this card's children. If null, refreshes various `topLevelCards` queries.
 *
 * Call this whenever a card is created, deleted, or moved.
 */
export function evictCardChildren(
  cache: ApolloCache<any>,
  options: { cardId: string } | { cardId: null; ownerId: string }
) {
  match(options)
    .with({ cardId: P.nullish }, (options) => {
      cache.evict({
        id: cache.identify({ __typename: 'Query', id: 'ROOT_QUERY' }),
        fieldName: 'topLevelCards',
      })
      cache.evict({
        id: cache.identify({ __typename: 'User', id: options.ownerId }),
        fieldName: 'topLevelCards',
      })
      // We are not evicting 'User.allCards' because it might be a lot of cards and we'd rather
      // rely on the switcher to refetch them automatically
    })
    .with({ cardId: P.string }, (options) => {
      const id = cache.identify({ __typename: 'Card', id: options.cardId })
      cache.evict({ id, fieldName: 'children' })
      cache.evict({ id, fieldName: 'childrenOrder' })
    })
    .exhaustive()
}

/**
 * Evict all queries that fetch this card's comments.
 */
export function evictCardComments(cache: ApolloCache<any>, options: { cardId: string }) {
  const id = cache.identify({ __typename: 'Card', id: options.cardId })
  cache.evict({ id, fieldName: 'comments' })
  cache.evict({ id, fieldName: 'commentCount' })
}
