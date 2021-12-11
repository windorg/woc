import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import Button from 'react-bootstrap/Button'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession } from 'next-auth/react'
import { canSeeBoard } from '../lib/access'
import { BoardCard } from '../components/boardCard'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import filterAsync from 'node-filter-async'
import { CreateBoardModal } from '../components/createBoardModal'
import update from 'immutability-helper'
import _ from 'lodash'

type Board_ = Board & { owner: { handle: string, displayName: string } }

type Props = {
  user: Pick<User, 'id' | 'handle' | 'displayName'> | null
  userBoards: Board_[]
  otherBoards: Board_[]
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const include = { owner: { select: { handle: true, displayName: true } } }
  const session = await getSession(context)
  if (session) {
    // Logged in
    const userBoards = await prisma.board.findMany({
      where: { ownerId: session.userId },
      include
    })
    const otherBoards = await prisma.board.findMany({
      where: { NOT: { ownerId: session.userId } },
      include
    }).then(x => filterAsync(x, board => canSeeBoard(session.userId, board)))
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, handle: true, displayName: true }
    })
    return {
      props: serialize({
        user,
        userBoards,
        otherBoards
      })
    }
  } else {
    // Not logged in
    const userBoards: Board_[] = []
    const otherBoards = await prisma.board.findMany({
      include
    }).then(x => filterAsync(x, board => canSeeBoard(null, board)))
    return {
      props: serialize({
        user: null,
        userBoards,
        otherBoards
      })
    }
  }
}

const Boards: NextPage<SuperJSONResult> = (props) => {
  const { user, userBoards: initialUserBoards, otherBoards } = deserialize<Props>(props)

  const [userBoards, setUserBoards] = useState(initialUserBoards)
  const addUserBoard = (board: Board) => {
    const board_ = { ...board, owner: user! }
    setUserBoards(prev => update(prev, { $push: [board_] }))
  }

  const [createBoardShown, setCreateBoardShown] = useState(false)

  return (
    <>
      <Head>
        <title>Boards / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb active />
      </Breadcrumb>

      {user
        ?
        <>
          <CreateBoardModal
            show={createBoardShown}
            onHide={() => setCreateBoardShown(false)}
            afterBoardCreated={board => {
              addUserBoard(board)
              setCreateBoardShown(false)
            }}
          />
          <h1 className="mt-5">
            Your boards
            {/* Without the lineHeight it looks very slightly weird*/}
            <Button className="ms-4" size="sm" variant="outline-primary" style={{ lineHeight: 1.54 }}
              onClick={() => setCreateBoardShown(true)}>
              + New
            </Button>
          </h1>
          <div className="row-cols-1 row-cols-md2">
            {_.orderBy(userBoards, ['createdAt'], ['desc'])
              .map(board => <BoardCard key={board.id} board={board} kind='own-board' />)}
          </div>
          <h1 className="mt-5">Others&apos; public boards</h1>
          <div className="row-cols-1 row-cols-md2">
            {_.orderBy(otherBoards, ['createdAt'], ['desc'])
              .map(board => <BoardCard key={board.id} board={board} kind='other-board' />)}
          </div>
        </>
        :
        <>
          <p>To create your own boards, please <Link href="/LoginOrSignup"><a>sign up</a></Link>.</p>
          <h1 className="mt-5">Public boards</h1>
          <div className="row-cols-1 row-cols-md2">
            {_.orderBy(otherBoards, ['createdAt'], ['desc'])
              .map(board => <BoardCard key={board.id} board={board} kind='other-board' />)}
          </div>
        </>
      }
    </>
  )
}

export default Boards
