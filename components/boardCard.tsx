import type * as GQL from 'generated/graphql/graphql'
import Link from 'next/link'
import { cardRoute, userRoute } from 'lib/routes'
import * as B from 'react-bootstrap'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'
import { Visibility } from '@lib/graphql/schema/visibility'

type Kind = 'own-board' | 'other-board'

const _getBoardOwner = graphql(`
  query getBoardOwner($userId: UUID!) {
    user(id: $userId) {
      id
      displayName
      handle
    }
  }
`)

export function BoardCard(props: {
  board: Pick<GQL.Card, 'id' | 'title' | 'ownerId' | 'visibility'>
  kind: Kind
}) {
  const { board, kind } = props
  const isPrivate = board.visibility === Visibility.Private

  const ownerQuery = useQuery(_getBoardOwner, { variables: { userId: props.board.ownerId } })

  return (
    <B.Card
      className={`position-relative woc-board mt-3 mb-3 ${isPrivate ? 'woc-board-private' : ''}`}
    >
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
        {kind === 'other-board' && (
          <Link href={userRoute(board.ownerId)}>
            <span>
              {ownerQuery.data ? (
                <>
                  <span className="me-2">{ownerQuery.data.user.displayName}</span>
                  <em>@{ownerQuery.data.user.handle}</em>
                </>
              ) : (
                <B.Spinner animation="border" size="sm" />
              )}
            </span>
          </Link>
        )}
      </B.Card.Body>
    </B.Card>
  )
}
