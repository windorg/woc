import { boardSettings } from "../lib/model-settings"
import Card from 'react-bootstrap/Card'
import Link from 'next/link'
import { Board, User } from "@prisma/client"

type Kind = 'own-board' | 'other-board'
type Board_ = Board & { owner: Pick<User, 'handle' | 'displayName'> }

export function BoardCard(props: { board: Board_, kind: Kind }) {
  const { board, kind } = props
  const isPrivate = boardSettings(board).visibility === 'private'
  return (
    <Card className={`woc-board mt-3 mb-3 ${isPrivate ? "woc-board-private" : ""}`}>
      <Card.Body>
        <h3>
          {isPrivate && "🔒 "}
          <Link href={`/ShowBoard?boardId=${board.id}`}>
            <a className={(kind === 'other-board') ? "text-muted" : ""}>
              {board.title}
            </a>
          </Link>
        </h3>
        {(kind === 'other-board') &&
          <Link href={`/ShowUser?userId=${board.ownerId}`}>
            <a>
              <span>
                <span className="me-2">{board.owner.displayName}</span>
                <em>@{board.owner.handle}</em>
              </span>
            </a>
          </Link>
        }
      </Card.Body>
    </Card>
  )
}