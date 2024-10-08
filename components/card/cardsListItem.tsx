import * as GQL from 'generated/graphql/graphql'
import * as B from 'react-bootstrap'
import { cardRoute } from 'lib/routes'
import styles from './shared.module.scss'
import Link from 'next/link'
import { HiFire } from 'react-icons/hi'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { useCurrentUser } from '@components/currentUserContext'
import { Comments } from './comments'

const useFireCard = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation fireCard($id: UUID!) {
        fireCard(id: $id) {
          card {
            id
            firedAt
          }
          parent {
            id
            childrenOrder
          }
        }
      }
    `)
  )
  return { do: action, result }
}

/**
 * A card in the children list.
 */
export function CardsListItemCollapsed(props: {
  /** Whether the card is being dragged in a list */
  dragged?: boolean
  card: Pick<GQL.Card, 'id' | 'title' | 'tagline' | 'visibility' | 'commentCount' | 'firedAt'>
}) {
  const currentUser = useCurrentUser()
  const { card } = props
  const dragged = props?.dragged ?? false
  const isPrivate = card.visibility === GQL.Visibility.Private
  const fireCardMutation = useFireCard()
  const recentlyFired =
    card.firedAt && new Date(card.firedAt).getTime() > Date.now() - 1000 * 60 * 60 * 24
  return (
    // NB: .position-relative is needed for .stretched-link to work properly
    <div
      className={`${styles.cardsListItem} woc-card position-relative ${
        dragged ? styles._dragged : ''
      }`}
    >
      <div className={styles._counter}>{card.commentCount || '−'}</div>
      <div className={styles._body}>
        <div className={styles._title}>
          {/* TODO: perhaps move lock+title into a separate div so that the lock icon is "inline" */}
          <span>{isPrivate ? '🔒 ' : ''}</span>
          {dragged ? (
            <a className="stretched-link">{card.title}</a>
          ) : (
            <Link href={cardRoute(card.id)} className="stretched-link">
              {card.title}
            </Link>
          )}
          {currentUser?.betaAccess && (
            <B.Button
              variant="outline-warning"
              size="sm"
              className={`${styles._fire} ${!recentlyFired ? styles._notRecentlyFired : ''}`}
              onClick={async () => fireCardMutation.do({ variables: { id: card.id } })}
              // TODO spinner?
            >
              <HiFire />
            </B.Button>
          )}
        </div>
        {card.tagline && <div className={styles._tagline}>{card.tagline}</div>}
      </div>
    </div>
  )
}

/**
 * A card in the children list, expanded to show all comments and to allow adding new comments.
 */
export function CardsListItemExpanded(props: {
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
  comments: React.ComponentProps<typeof Comments>['comments']
}) {
  const currentUser = useCurrentUser()
  const { card } = props
  const isPrivate = card.visibility === GQL.Visibility.Private
  const fireCardMutation = useFireCard()
  const recentlyFired =
    card.firedAt && new Date(card.firedAt).getTime() > Date.now() - 1000 * 60 * 60 * 24
  return (
    <div className={`${styles.cardsListItem} ${styles._expanded} woc-card `}>
      <div className={styles._body}>
        {/* NB: .position-relative is needed for .stretched-link to work properly -- it specifies which parent element will be the 'link' */}
        <div className={`${styles._titleWithTagline} position-relative`}>
          <div className={styles._title}>
            {/* TODO: perhaps move lock+title into a separate div so that the lock icon is "inline" */}
            <span>{isPrivate ? '🔒 ' : ''}</span>
            <Link href={cardRoute(card.id)} className="stretched-link">
              {card.title}
            </Link>
            {currentUser?.betaAccess && (
              <B.Button
                variant="outline-warning"
                size="sm"
                className={`${styles._fire} ${!recentlyFired ? styles._notRecentlyFired : ''}`}
                onClick={async () => fireCardMutation.do({ variables: { id: card.id } })}
                // TODO spinner?
              >
                <HiFire />
              </B.Button>
            )}
          </div>
          {card.tagline && <div className={styles._tagline}>{card.tagline}</div>}
        </div>
        <Comments card={props.card} comments={props.comments} compact />
      </div>
    </div>
  )
}
