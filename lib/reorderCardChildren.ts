import type * as GQL from 'generated/graphql/graphql'
import { match, P } from 'ts-pattern'
import { deleteSync, insertAfter, insertBefore, insertPosition } from 'lib/array'

/**
 * Say what the result of reordering the children of a card would be.
 *
 * We want the same logic for reordering card children on the server and on the client, so that we can perform optimistic updates.
 */
export function reorderCardChildren(
  input: GQL.ReorderCardChildrenInput,
  childrenOrder: GQL.Card['childrenOrder'],
  onBadInput: (err: string) => void
): GQL.Card['childrenOrder'] {
  const filtered = deleteSync(childrenOrder, input.childId)
  return match(input)
    .with({ position: P.number }, (input) =>
      insertPosition(input.childId, filtered, input.position)
    )
    .with({ before: P.string }, (input) => insertBefore(input.childId, filtered, input.before))
    .with({ after: P.string }, (input) => insertAfter(input.childId, filtered, input.after))
    .otherwise(() => {
      onBadInput('Exactly one of `position`, `before`, or `after` must be provided')
      return childrenOrder
    })
}
