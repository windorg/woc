import * as Dnd from "@dnd-kit/core"
import * as DndSort from "@dnd-kit/sortable"
import { Card } from "@prisma/client"
import { CardCard } from "./cardCard"
import { CSS } from '@dnd-kit/utilities'
import { useReorderCards } from "lib/queries/boards"
import { filterSync, insertPosition } from "lib/array"

type Card_ = Card & { _count: { comments: number } }

// A list of cards, supporting drag-and-drop
export function CardsList(props: {
  cards: Card_[]
}) {
  const sensors = Dnd.useSensors(
    Dnd.useSensor(Dnd.MouseSensor, {
      activationConstraint: {
        distance: 10,
      }
    }),
    Dnd.useSensor(Dnd.TouchSensor, {
      activationConstraint: {
        distance: 10,
      }
    }),
    Dnd.useSensor(Dnd.KeyboardSensor, {
      coordinateGetter: DndSort.sortableKeyboardCoordinates,
    })
  )

  const reorderCardsMutation = useReorderCards()

  const handleDragEnd = async (event: Dnd.DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const ids = props.cards.map(x => x.id)
    // The semantics of 'over' is weird — it's the element before if we're dragging back, and element after
    // if we're dragging forward. However, I've checked and the index of over == the resulting index in the list.
    const newIndex = ids.indexOf(over.id)
    // If we know the resulting index, we can just apply the reordering and then look at before/after. Note: we
    // can't use 'position' because it ignores archived cards.
    const newOrder = insertPosition(active.id, filterSync(ids, id => id !== active.id), newIndex)
    const prev: Card['id'] | undefined = newOrder[newIndex - 1]
    const next: Card['id'] | undefined = newOrder[newIndex + 1]
    if (active.id !== over.id) {
      await reorderCardsMutation.mutateAsync({
        boardId: props.cards[0].boardId,
        cardId: active.id,
        ...(next ? { before: next } : { after: prev })
      })
    }
  }

  return (
    <Dnd.DndContext
      sensors={sensors}
      collisionDetection={Dnd.closestCenter}
      measuring={{ droppable: { strategy: Dnd.MeasuringStrategy.Always } }}
      onDragEnd={handleDragEnd}
    >
      <DndSort.SortableContext
        items={props.cards}
        strategy={DndSort.verticalListSortingStrategy}
      >
        {props.cards.map(card => (<Sortable key={card.id} card={card} />))}
      </DndSort.SortableContext>
    </Dnd.DndContext>
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

function Sortable(props: {
  card: Card_
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = DndSort.useSortable({
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
      <CardCard card={props.card} dragged={isDragging} />
    </div>
  )
}