import { Board } from '@prisma/client'
import _ from "lodash"
import { useState } from "react"
import * as B from 'react-bootstrap'
import { BoardCard } from "./boardCard"
import { CreateBoardModal } from "./createBoardModal"

type Board_ = Board & { owner: { handle: string, displayName: string } }

export function BoardsList(props: {
  allowNewBoard: boolean
  heading: string
  boards: Board_[]
  showUserHandles: boolean
  kind: 'own-board' | 'other-board'
}) {
  const [createBoardShown, setCreateBoardShown] = useState(false)

  return <>
    {props.allowNewBoard &&
      <CreateBoardModal
        show={createBoardShown}
        onHide={() => setCreateBoardShown(false)}
        afterBoardCreated={() => setCreateBoardShown(false)}
      />
    }
    <h1 className="mt-5">
      {props.heading}
      {props.allowNewBoard && <>
        <B.Button className="ms-4" size="sm" variant="outline-primary"
          onClick={() => setCreateBoardShown(true)}>
          + New
        </B.Button>
      </>
      }
    </h1>
    <div>
      {_.orderBy(props.boards, ['createdAt'], ['desc'])
        .map(board => <BoardCard key={board.id} board={board} kind={props.kind} />)}
    </div>
  </>
}

