import * as GQL from 'generated/graphql/graphql'
import Link from 'next/link'
import { cardRoute, userRoute } from 'lib/routes'
import * as B from 'react-bootstrap'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'
import styles from './boardCard.module.scss'
import ReactTimeAgo from 'react-time-ago'
import { Query } from './query'

type Kind = 'own-board' | 'other-board'

const useGetBoardOwner = (variables: { userId: string }) => {
  return useQuery(
    graphql(`
      query getBoardOwner($userId: UUID!) {
        user(id: $userId) {
          id
          displayName
          handle
        }
      }
    `),
    { variables }
  )
}

export function BoardCard(props: {
  board: Pick<GQL.Card, 'id' | 'title' | 'createdAt' | 'tagline' | 'ownerId' | 'visibility'>
  kind: Kind
}) {
  const { board, kind } = props
  const isPrivate = board.visibility === GQL.Visibility.Private

  const boardOwnerQuery = useGetBoardOwner({ userId: props.board.ownerId })

  return (
    <B.Card className={styles._card}>
      <B.Card.Body>
        <h3>
          {isPrivate && '🔒 '}
          <Link
            href={cardRoute(board.id)}
            className={kind === 'other-board' ? 'text-muted' : 'stretched-link'}
          >
            {board.title}
          </Link>
        </h3>
        {board.tagline && <div className={styles._tagline}>{board.tagline}</div>}
      </B.Card.Body>

      <B.Card.Footer className={styles._infobar}>
        <span className={styles._date}>
          Created <ReactTimeAgo date={board.createdAt} />
        </span>
        {kind === 'other-board' && (
          <Query size="sm" queries={{ boardOwnerQuery }}>
            {({ boardOwnerQuery: { user } }) => (
              <Link href={userRoute(board.ownerId)}>
                {user.displayName}
                <em className="ms-2">@{user.handle}</em>
              </Link>
            )}
          </Query>
        )}
      </B.Card.Footer>
    </B.Card>
  )
}
