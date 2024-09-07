import * as Dnd from '@dnd-kit/core'
import * as DndSort from '@dnd-kit/sortable'
import * as DndModifiers from '@dnd-kit/modifiers'
import type * as GQL from 'generated/graphql/graphql'
import { CardsListItemCollapsed, CardsListItemExpanded } from './cardsListItem'
import { CSS } from '@dnd-kit/utilities'
import { deleteSync, insertPosition } from 'lib/array'
import { graphql } from 'generated/graphql'
import { useApolloClient, useMutation, useQuery } from '@apollo/client'
import { evictCardChildren } from '@lib/graphql/cache'
import { reorderCardChildren } from '@lib/reorderCardChildren'
import _ from 'lodash'
import { Query } from '@components/query'

const useReorderChild = () => {
  const cache = useApolloClient().cache
  const [action, result] = useMutation(
    graphql(`
      mutation reorderChild($id: UUID!, $childId: UUID!, $before: UUID, $after: UUID) {
        reorderCardChildren(input: { id: $id, childId: $childId, before: $before, after: $after }) {
          card {
            id
            childrenOrder
          }
        }
      }
    `),
    {
      update: (cache, { data }, { variables }) => {
        evictCardChildren(cache, { cardId: data!.reorderCardChildren.card.id })
      },
    }
  )
  return {
    do: (async (options) => {
      cache.modify({
        optimistic: true,
        id: cache.identify({ __typename: 'Card', id: options!.variables!.id }),
        fields: {
          childrenOrder: (previousChildrenOrder) =>
            reorderCardChildren(options!.variables!, previousChildrenOrder, console.error),
        },
      })
      return action(options)
    }) satisfies typeof action,
    result,
  }
}

const useGetComments = (variables: { cardId: string }) => {
  return useQuery(
    graphql(`
      query getComments($cardId: UUID!) {
        card(id: $cardId) {
          id
          comments {
            id
            content
            createdAt
            visibility
            pinned
            canEdit
            replies {
              id
              content
              visibility
              canEdit
              createdAt
              canDelete
              author {
                id
                displayName
                userpicUrl
              }
            }
          }
        }
      }
    `),
    { variables }
  )
}

/**
 * A list of cards, supporting drag-and-drop
 */
export function CardsList(props: {
  parentId: GQL.Card['id']
  cards: Pick<
    GQL.Card,
    | 'id'
    | 'title'
    | 'tagline'
    | 'visibility'
    | 'commentCount'
    | 'firedAt'
    | 'canEdit'
    | 'reverseOrder'
  >[]
  /** Whether to show the cards as expanded or collapsed */
  expandCards: boolean
  allowEdit: boolean
}) {
  const sensors = Dnd.useSensors(
    Dnd.useSensor(Dnd.MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    Dnd.useSensor(Dnd.TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    Dnd.useSensor(Dnd.KeyboardSensor, {
      coordinateGetter: DndSort.sortableKeyboardCoordinates,
    })
  )

  const reorderChildMutation = useReorderChild()

  const handleDragEnd = async (event: Dnd.DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const ids = props.cards.map((x) => x.id)
    // The semantics of 'over' is weird — it's the element before if we're dragging back, and
    // element after if we're dragging forward. However, I've checked and the index of over == the
    // resulting index in the list.
    const newIndex = ids.indexOf(over.id.toString())
    // If we know the resulting index, we can just apply the reordering and then look at
    // before/after. Note: we can't use 'position' because it ignores archived cards.
    const newOrder = insertPosition(active.id, deleteSync(ids, active.id), newIndex)
    const prev: GQL.Card['id'] | undefined = newOrder[newIndex - 1]?.toString()
    const next: GQL.Card['id'] | undefined = newOrder[newIndex + 1]?.toString()
    if (active.id !== over.id) {
      await reorderChildMutation.do({
        variables: {
          id: props.parentId,
          childId: active.id.toString(),
          ...(next ? { before: next, after: null } : { after: prev, before: null }),
        },
      })
    }
  }

  if (props.allowEdit && !props.expandCards) {
    return (
      <Dnd.DndContext
        sensors={sensors}
        modifiers={[DndModifiers.restrictToVerticalAxis]}
        collisionDetection={Dnd.closestCenter}
        measuring={{ droppable: { strategy: Dnd.MeasuringStrategy.Always } }}
        onDragEnd={handleDragEnd}
      >
        <DndSort.SortableContext items={props.cards} strategy={DndSort.verticalListSortingStrategy}>
          {props.cards.map((card) => (
            <SortableCardsListItem key={card.id} card={card} />
          ))}
        </DndSort.SortableContext>
      </Dnd.DndContext>
    )
  } else {
    return (
      <>
        {props.cards.map((card) =>
          props.expandCards ? (
            <SubcardWithFetchingComments key={card.id} card={card} />
          ) : (
            <CardsListItemCollapsed key={card.id} card={card} />
          )
        )}
      </>
    )
  }
}

function SubcardWithFetchingComments(props: {
  card: Pick<
    GQL.Card,
    | 'id'
    | 'title'
    | 'tagline'
    | 'visibility'
    | 'commentCount'
    | 'firedAt'
    | 'canEdit'
    | 'reverseOrder'
  >
}) {
  const commentsQuery = useGetComments({ cardId: props.card.id })
  return (
    <Query queries={{ commentsQuery }}>
      {({
        commentsQuery: {
          card: { comments },
        },
      }) => <CardsListItemExpanded card={props.card} comments={comments} />}
    </Query>
  )
}

// https://github.com/clauderic/dnd-kit/discussions/108
function animateLayoutChanges(args) {
  const { isSorting, wasSorting } = args
  if (isSorting || wasSorting) {
    return DndSort.defaultAnimateLayoutChanges(args)
  }
  return true
}

function SortableCardsListItem(props: {
  card: Pick<GQL.Card, 'id' | 'title' | 'tagline' | 'visibility' | 'commentCount' | 'firedAt'>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    DndSort.useSortable({
      animateLayoutChanges,
      id: props.card.id,
    })

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 999 : 0,
    position: 'relative' as const,
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardsListItemCollapsed card={props.card} dragged={isDragging} />
    </div>
  )
}
