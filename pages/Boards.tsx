import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn } from 'next-auth/react'
import { CanSee, canSeeBoard, unsafeCanSee } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { filterAsync, filterSync } from 'lib/array'
import * as R from 'ramda'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import assert from 'assert'

type Board_ = CanSee & Board & { owner: { handle: string, displayName: string } }

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

    // NB: we don't need to use 'canSeeBoard' here because of course the user can see their own boards, but it's
    // type-safer this way
    const userBoards = await prisma.board.findMany({
      where: { ownerId: session.userId },
      include
    }).then(xs => filterSync(xs, (board): board is Board_ => canSeeBoard(session.userId, board)))
    const otherBoards = await prisma.board.findMany({
      where: { NOT: { ownerId: session.userId } },
      include
    }).then(xs => filterSync(xs, (board): board is Board_ => canSeeBoard(session.userId, board)))
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, handle: true, displayName: true }
    })
    const props: Props = {
      user,
      userBoards,
      otherBoards
    }
    return {
      props: serialize(props)
    }
  } else {
    // Not logged in
    const userBoards: Board_[] = []
    const otherBoards = await prisma.board.findMany({
      include
    }).then(xs => filterSync(xs, (board): board is Board_ => canSeeBoard(null, board)))
    const props: Props = {
      user: null,
      userBoards,
      otherBoards
    }
    return {
      props: serialize(props)
    }
  }
}

const Boards: NextPage<SuperJSONResult> = (props) => {
  const { user, userBoards: initialUserBoards, otherBoards } = deserialize<Props>(props)

  const [userBoards, setUserBoards] = useState(initialUserBoards)
  const addUserBoard = (board: Board) => {
    // You can see things that you already have
    const board_ = unsafeCanSee({ ...board, owner: user! })
    setUserBoards(userBoards => (userBoards.concat([board_])))
  }

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
          <BoardsList
            allowNewBoard={true}
            afterBoardCreated={addUserBoard}
            heading="Your boards"
            boards={userBoards}
            showUserHandles={false}
            kind="own-board" />
          <BoardsList
            allowNewBoard={false}
            heading="Others' public boards"
            boards={otherBoards}
            showUserHandles={false}
            kind="other-board" />
        </>
        :
        <>
          <p>
            To create your own boards, please <a href="#" onClick={async () => signIn()}>log in</a> or <Link href="/Signup"><a>sign up</a></Link>.
          </p>
          <BoardsList
            allowNewBoard={false}
            heading="Public boards"
            boards={otherBoards}
            showUserHandles={false}
            kind="other-board" />
        </>
      }
    </>
  )
}

export default Boards
