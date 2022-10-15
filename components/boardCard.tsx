import { cardSettings } from "../lib/model-settings"
import Link from 'next/link'
import { Card, User } from "@prisma/client"
import { cardRoute, userRoute } from "lib/routes"
import LinkPreload from "lib/link-preload"
import * as B from 'react-bootstrap'
import { useUser } from "@lib/queries/user"

type Kind = 'own-board' | 'other-board'
type Board_ = Omit<Card, 'childrenOrder'>

export function BoardCard(props: { board: Board_, kind: Kind }) {
  const { board, kind } = props
  const isPrivate = cardSettings(board).visibility === 'private'

  const ownerQuery = useUser({ userId: props.board.ownerId })

  return (
    <B.Card className={`position-relative woc-board mt-3 mb-3 ${isPrivate ? "woc-board-private" : ""}`}>
      <B.Card.Body>
        <h3>
          {isPrivate && "🔒 "}
          <LinkPreload href={cardRoute(board.id)}>
            <a className={(kind === 'other-board') ? "text-muted" : "stretched-link"}>
              {board.title}
            </a>
          </LinkPreload>
        </h3>
        {(kind === 'other-board') &&
          <LinkPreload href={userRoute(board.ownerId)}>
            <a>
              <span>
                {ownerQuery.data
                  ? <>
                    <span className="me-2">{ownerQuery.data.displayName}</span>
                    <em>@{ownerQuery.data.handle}</em>
                  </>
                  : <B.Spinner animation="border" size="sm" />
                }
              </span>
            </a>
          </LinkPreload>
        }
      </B.Card.Body>
    </B.Card>
  )
}