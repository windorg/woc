import { sortByIdOrder } from '@lib/array'
import { cardSettings } from '@lib/model-settings'
import _ from 'lodash'
import { GetCardData } from 'pages/api/cards/get'
import { ListCardsData } from 'pages/api/cards/list'
import { AddCardForm } from './addCardForm'
import { CardsList } from './cardsList'
import styles from './shared.module.scss'

export function Subcards(props: {
  parent: GetCardData
  cards: ListCardsData
}) {
  const { parent, cards } = props
  const [normalCards, archivedCards] =
    _.partition(
      sortByIdOrder(cards, parent.childrenOrder, { onMissingElement: 'skip' }),
      card => (!cardSettings(card).archived)
    )
  return (
    <div className={styles.subcards}>
      <div className={styles._label}>
        <span>Sub-cards</span>
      </div>
      <div className={styles._list}>
        {parent.canEdit && <AddCardForm parentId={parent.id} />}
        <CardsList parentId={parent.id} cards={normalCards} allowEdit={parent.canEdit} />
      </div>
    </div>
    //   {
    //   (archivedCards.length > 0) &&
    //     <B.Accordion className="mt-5">
    //       <B.Accordion.Item eventKey="0">
    //         <B.Accordion.Header>
    //           <B.Badge bg="secondary">Archived cards</B.Badge>
    //         </B.Accordion.Header>
    //         <B.Accordion.Body>
    //           <CardsList parentId={card.id} cards={archivedCards} allowEdit={card.canEdit} />
    //         </B.Accordion.Body>
    //       </B.Accordion.Item>
    //     </B.Accordion>
    // }
  )
}

