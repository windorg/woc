import { cardSettings } from '@lib/model-settings'
import Link from 'next/link'
import { Card, User } from '@prisma/client'
import { cardRoute, userRoute } from 'lib/routes'
import * as B from 'react-bootstrap'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'

type Kind = 'own-board' | 'other-board'
type Board_ = Omit<Card, 'childrenOrder'>

const getBoardOwnerDocument = graphql(`
  query getBoardOwner($userId: String!) {
    user(id: $userId) {
      displayName
      handle
    }
  }
`)

export function BoardCard(props: { board: Board_; kind: Kind }) {
  const { board, kind } = props
  const isPrivate = cardSettings(board).visibility === 'private'

  const ownerQuery = useQuery(getBoardOwnerDocument, { variables: { userId: props.board.ownerId } })

  return (
    <B.Card className={`position-relative woc-board mt-3 mb-3 ${isPrivate ? 'woc-board-private' : ''}`}>
      <B.Card.Body>
        <h3>
          {isPrivate && '🔒 '}
          <Link href={cardRoute(board.id)}>
            <a className={kind === 'other-board' ? 'text-muted' : 'stretched-link'}>{board.title}</a>
          </Link>
        </h3>
        {kind === 'other-board' && (
          <Link href={userRoute(board.ownerId)}>
            <a>
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
            </a>
          </Link>
        )}
      </B.Card.Body>
    </B.Card>
  )
}
