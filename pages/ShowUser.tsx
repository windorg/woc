import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb, UserCrumb } from '../components/breadcrumbs'
import { getSession, useSession } from 'next-auth/react'
import { CanSee, canSeeBoard, unsafeCanSee } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import { callUnfollowUser } from './api/users/unfollow'
import Button from 'react-bootstrap/Button'
import { callFollowUser } from './api/users/follow'
import { filterSync } from 'lib/array'

// Strictly speaking the owner is not necessary here, but it's easier types-wise this way
type Board_ = CanSee & Board & { owner: { handle: string, displayName: string } }

type Props = {
  // The 'followed' field be null if there's no logged-in user
  user: Pick<User, 'id' | 'handle' | 'displayName'> & { followed: boolean | null }
  boards: Board_[]
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  const user = await prisma.user.findUnique({
    where: { id: context.query.userId as string },
    select: { id: true, handle: true, displayName: true },
    rejectOnNotFound: true,
  })
  const followed: boolean | null =
    session
      ? await prisma.followedUser.count({
        where: {
          subscriberId: session.userId,
          followedUserId: user.id,
        }
      }).then(Boolean)
      : null
  const boards = await prisma.board.findMany({
    include: { owner: { select: { handle: true, displayName: true } } },
    where: { ownerId: context.query.userId as string }
  }).then(xs => filterSync(xs, (board): board is Board_ => canSeeBoard(session?.userId ?? null, board)))
  const props: Props = {
    user: { ...user, followed },
    boards
  }
  return {
    props: serialize(props)
  }
}

function FollowButton(props: { user, afterFollowUser, afterUnfollowUser }) {
  return (
    props.user.followed
      ?
      <Button size="sm" variant="outline-secondary"
        onClick={async () => {
          await callUnfollowUser({ userId: props.user.id })
          props.afterUnfollowUser()
        }}>
        Unfollow
      </Button>
      :
      <Button size="sm" variant="outline-primary"
        onClick={async () => {
          await callFollowUser({ userId: props.user.id })
          props.afterFollowUser()
        }}>
        Follow
      </Button>
  )
}

const ShowUser: NextPage<SuperJSONResult> = (props) => {
  const { data: session } = useSession()
  const { user: initialUser, boards: initialBoards } = deserialize<Props>(props)

  const [boards, setBoards] = useState(initialBoards)
  const addBoard = (board: Board) => {
    // You can see things that you already have
    const board_ = unsafeCanSee({ ...board, owner: user! })
    setBoards(boards => boards.concat([board_]))
  }

  const [user, setUser] = useState(initialUser)

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
        {/* TODO should show up even when the user isn't logged in */}
        {(user.followed !== null) &&
          <>
            <span className="ms-4" />
            <FollowButton
              user={user}
              afterFollowUser={() => setUser(prev => ({ ...prev, followed: true }))}
              afterUnfollowUser={() => setUser(prev => ({ ...prev, followed: false }))}
            />
          </>
        }
      </h1>

      <BoardsList
        allowNewBoard={(session?.userId ?? null) === user.id}
        heading="Boards"
        boards={boards}
        showUserHandles={false}
        kind="own-board" />
    </>
  )
}

export default ShowUser
