import type * as GQL from 'generated/graphql/graphql'
import * as B from 'react-bootstrap'
import { cardRoute } from 'lib/routes'
import styles from './shared.module.scss'
import Link from 'next/link'
import { Visibility } from '@lib/graphql/schema/visibility'

// A card in the sub-cards list
export function CardsListItem(props: {
  // Whether the card is being dragged in a list
  dragged?: boolean
  card: Pick<GQL.Card, 'id' | 'title' | 'tagline' | 'visibility' | 'commentCount'>
}) {
  const { card } = props
  const dragged = props?.dragged ?? false
  const isPrivate = card.visibility === Visibility.Private
  return (
    // NB: .position-relative is needed for .stretched-link to work properly
    <div
      className={`${styles.cardsListItem} woc-card position-relative ${
        dragged ? styles._dragged : ''
      }`}
    >
      <div className={styles._counter}>{card.commentCount || '−'}</div>
      <div className={styles._body}>
        <div>
          {isPrivate ? '🔒 ' : ''}
          {dragged ? (
            <a className="stretched-link">{card.title}</a>
          ) : (
            <Link href={cardRoute(card.id)} className="stretched-link">
              {card.title}
            </Link>
          )}
        </div>
        {card.tagline && <div className={styles._tagline}>{card.tagline}</div>}
      </div>
    </div>
  )
}
