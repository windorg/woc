import * as Dnd from "@dnd-kit/core"
import * as DndSort from "@dnd-kit/sortable"
import { Card } from "@prisma/client"
import { CardCard } from "./cardCard"
import { CSS } from '@dnd-kit/utilities'
import { useReorderCards } from "lib/queries/boards"

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
    if (over && (active.id !== over.id)) {
      await reorderCardsMutation.mutateAsync({
        boardId: props.cards[0].boardId,
        cardId: active.id,
        position: props.cards.map(x => x.id).indexOf(over.id),
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
    position: 'relative' as 'relative',
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardCard card={props.card} dragged={isDragging} />
    </div>
  )
}