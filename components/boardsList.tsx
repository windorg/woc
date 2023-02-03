import { orderBy } from '@lib/array'
import type * as GQL from 'generated/graphql/graphql'
import { useState } from 'react'
import * as B from 'react-bootstrap'
import { BoardCard } from './boardCard'
import { CreateBoardModal } from './createBoardModal'

export function BoardsList(props: {
  allowNewBoard: boolean
  heading: string
  boards: Pick<GQL.Card, 'id' | 'createdAt' | 'title' | 'tagline' | 'ownerId' | 'visibility'>[]
  // If other-board, we will show user handles
  kind: 'own-board' | 'other-board'
}) {
  const [createBoardShown, setCreateBoardShown] = useState(false)

  return (
    <>
      {props.allowNewBoard && (
        <CreateBoardModal
          show={createBoardShown}
          onHide={() => setCreateBoardShown(false)}
          afterCreate={() => setCreateBoardShown(false)}
        />
      )}
      <h1 className="mt-5">
        {props.heading}
        {props.allowNewBoard && (
          <>
            <B.Button
              className="ms-4"
              size="sm"
              variant="outline-primary"
              onClick={() => setCreateBoardShown(true)}
            >
              + New
            </B.Button>
          </>
        )}
      </h1>
      <div>
        {orderBy(props.boards, 'createdAt', 'desc').map((board) => (
          <BoardCard key={board.id} board={board} kind={props.kind} />
        ))}
      </div>
    </>
  )
}
