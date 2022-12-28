import { sortByIdOrder } from '@lib/array'
import { cardSettings } from '@lib/model-settings'
import { LinkButton } from 'components/linkButton'
import _ from 'lodash'
import { GetCardData } from 'pages/api/cards/get'
import { ListCardsData } from 'pages/api/cards/list'
import * as React from 'react'
import { AddCardForm } from './addCardForm'
import { CardsList } from './cardsList'
import { BiArchive } from 'react-icons/bi'
import styles from './shared.module.scss'

export function Subcards(props: { parent: GetCardData; cards: ListCardsData }) {
  const { parent, cards } = props
  const [normalCards, archivedCards] = _.partition(
    sortByIdOrder(cards, parent.childrenOrder, { onMissingElement: 'skip' }),
    (card) => !cardSettings(card).archived
  )
  const [showArchived, setShowArchived] = React.useState(false)
  return (
    <div className={styles.subcards}>
      <div className={styles.sectionHeader}>
        <span className={styles._label}>
          Sub-cards
          {showArchived ? ' — archived' : ''}
          {showArchived ? ` (${archivedCards.length})` : ` (${normalCards.length})`}
        </span>
        {showArchived ? (
          <LinkButton icon={<BiArchive />} onClick={() => setShowArchived(false)}>
            Back
          </LinkButton>
        ) : (
          <LinkButton icon={<BiArchive />} onClick={() => setShowArchived(true)}>
            Archived
          </LinkButton>
        )}
      </div>
      <div className={styles._list}>
        {parent.canEdit && !showArchived && <AddCardForm parentId={parent.id} />}
        <CardsList parentId={parent.id} cards={showArchived ? archivedCards : normalCards} allowEdit={parent.canEdit} />
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
