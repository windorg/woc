import type * as GQL from 'generated/graphql/graphql'
import { sortByIdOrder } from '@lib/array'
import { cardSettings } from '@lib/model-settings'
import { LinkButton } from 'components/linkButton'
import _ from 'lodash'
import * as React from 'react'
import { AddCardForm } from './addCardForm'
import { CardsList } from './cardsList'
import { BiArchive } from 'react-icons/bi'
import styles from './shared.module.scss'

export function Subcards(props: {
  parent: Pick<GQL.Card, 'id' | 'childrenOrder' | 'canEdit'>
  cards: Pick<
    GQL.Card,
    'id' | 'title' | 'tagline' | 'archived' | 'visibility' | 'commentCount' | 'firedAt'
  >[]
}) {
  const { parent, cards } = props
  const [normalCards, archivedCards] = _.partition(
    sortByIdOrder(cards, parent.childrenOrder, { onMissingElement: 'skip' }),
    (card) => !card.archived
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
        <CardsList
          parentId={parent.id}
          cards={showArchived ? archivedCards : normalCards}
          allowEdit={parent.canEdit}
        />
      </div>
    </div>
  )
}
