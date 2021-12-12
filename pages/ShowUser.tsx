import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb, UserCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession } from 'next-auth/react'
import { canSeeBoard } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import filterAsync from 'node-filter-async'
import update from 'immutability-helper'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'

// Strictly speaking the owner is not necessary here, but it's easier types-wise this way
type Board_ = Board & { owner: { handle: string, displayName: string } }

type Props = {
  user: Pick<User, 'id' | 'handle' | 'displayName'>
  loggedInUser: User['id'] | null
  boards: Board_[]
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  const user = await prisma.user.findUnique({
    where: { id: context.query.userId as string },
    rejectOnNotFound: true,
  })
  const boards = await prisma.board.findMany({
    include: { owner: { select: { handle: true, displayName: true } } },
    where: { ownerId: context.query.userId as string }
  }).then(x => filterAsync(x, board => canSeeBoard(session?.userId, board)))
  const props: Props = {
    user,
    loggedInUser: session?.userId,
    boards
  }
  return {
    props: serialize(props)
  }
}

const ShowUser: NextPage<SuperJSONResult> = (props) => {
  const { user, loggedInUser, boards: initialBoards } = deserialize<Props>(props)

  const [boards, setBoards] = useState(initialBoards)
  const addBoard = (board: Board) => {
    const board_ = { ...board, owner: user! }
    setBoards(prev => update(prev, { $push: [board_] }))
  }

  return (
    <>
      <Head>
        <title>{user.displayName} @{user.handle} / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={user} active />
      </Breadcrumb>

      <h1>
        <span className="me-3">{user.displayName}</span>
        <em>@{user.handle}</em>
        {/* TODO follow/unfollow */}
      </h1>

      <BoardsList
        allowNewBoard={loggedInUser === user.id}
        afterBoardCreated={addBoard}
        heading="Boards"
        boards={boards}
        showUserHandles={false}
        kind="own-board" />
    </>
  )
}

export default ShowUser
