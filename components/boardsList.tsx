import { Board } from "@prisma/client"
import _ from "lodash"
import { useState } from "react"
import { Button } from "react-bootstrap"
import { BoardCard } from "./boardCard"
import { CreateBoardModal } from "./createBoardModal"

type Board_ = Board & { owner: { handle: string, displayName: string } }

export function BoardsList(props: {
  allowNewBoard: boolean
  afterBoardCreated?: (newBoard: Board) => void
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
        afterBoardCreated={board => {
          props.afterBoardCreated!(board)
          setCreateBoardShown(false)
        }}
      />
    }
    <h1 className="mt-5">
      {props.heading}
      {props.allowNewBoard && <>
        {/* Without the lineHeight it looks very slightly weird*/}
        <Button className="ms-4" size="sm" variant="outline-primary" style={{ lineHeight: 1.54 }}
          onClick={() => setCreateBoardShown(true)}>
          + New
        </Button>
      </>
      }
    </h1>
    <div className="row-cols-1 row-cols-md2">
      {_.orderBy(props.boards, ['createdAt'], ['desc'])
        .map(board => <BoardCard key={board.id} board={board} kind={props.kind} />)}
    </div>
  </>
}

