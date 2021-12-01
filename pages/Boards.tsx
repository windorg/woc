import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession } from 'next-auth/react'
import { canSeeBoard } from '../lib/access'
import { BoardCard } from '../components/boardCard'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'

type Board_ = Board & { owner: { handle: string, displayName: string } }

type Props = {
  userId: User['id'] | null
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
      include,
      orderBy: { createdAt: "desc" }
    })
    const otherBoards = await prisma.board.findMany({
      where: { NOT: { ownerId: session.userId } },
      include,
      orderBy: { createdAt: "desc" }
    }).then(x => x.filter(board => canSeeBoard(session.userId, board)))
    return { props: serialize({ userId: session.userId, userBoards, otherBoards }) }
  } else {
    // Not logged in
    const userBoards: Board_[] = []
    const otherBoards = await prisma.board.findMany({
      include,
      orderBy: { createdAt: "desc" }
    }).then(x => x.filter(board => canSeeBoard(null, board)))
    return { props: serialize({ userId: null, userBoards, otherBoards }) }
  }
}

const Boards: NextPage<SuperJSONResult> = (props) => {
  const { userId, userBoards, otherBoards } = deserialize<Props>(props)

  return (
    <>
      <Head>
        <title>Boards / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb active />
      </Breadcrumb>

      {userId
        ? <>
          <h1 className="mt-5">Your boards</h1>
          <div className="row-cols-1 row-cols-md2">
            {userBoards.map(board => <BoardCard key={board.id} board={board} kind='own-board' />)}
          </div>
          <h1 className="mt-5">Others&apos; public boards</h1>
          <div className="row-cols-1 row-cols-md2">
            {otherBoards.map(board => <BoardCard key={board.id} board={board} kind='other-board' />)}
          </div>
        </>
        : <>
          <p>To create your own boards, please <Link href="/LoginOrSignup"><a>sign up</a></Link>.</p>
          <h1 className="mt-5">Public boards</h1>
          <div className="row-cols-1 row-cols-md2">
            {otherBoards.map(board => <BoardCard key={board.id} board={board} kind='other-board' />)}
          </div>
        </>
      }
    </>
  )
}

export default Boards
