import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import React, { useState } from 'react'
import { BoardsCrumb, UserCrumb } from '../components/breadcrumbs'
import { getSession, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import { prefetchUser, useFollowUser, useUnfollowUser, useUser } from 'lib/queries/user'
import { prefetchBoards, useBoards } from 'lib/queries/boards'
import { GetUserData, serverGetUser } from './api/users/get'
import { ListBoardsData, serverListBoards } from './api/boards/list'
import { PreloadContext, WithPreload } from 'lib/link-preload'

type Props = {
  userId: User['id']
  user?: GetUserData
  boards?: ListBoardsData
}

async function preload(context: PreloadContext): Promise<void> {
  const userId = context.query.userId as string
  await Promise.all([
    prefetchUser(context.queryClient, { userId }),
    prefetchBoards(context.queryClient, { users: [userId] })
  ])
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const userId = context.query.userId as string
  const props: Props = { userId }
  if (typeof window === 'undefined') {
    const session = await getSession(context)
    await serverGetUser(session, { userId })
      .then(result => { if (result.success) props.user = result.data })
    await serverListBoards(session, { users: [userId] })
      .then(result => { if (result.success) props.boards = result.data })
  }
  return serialize(props)
}

function FollowButton(props: { user }) {
  const followUserMutation = useFollowUser()
  const unfollowUserMutation = useUnfollowUser()
  return (
    props.user.followed
      ?
      <B.Button size="sm" variant="outline-secondary"
        disabled={unfollowUserMutation.isLoading}
        onClick={async () => {
          await unfollowUserMutation.mutateAsync({ userId: props.user.id })
        }}>
        Unfollow
        {unfollowUserMutation.isLoading && <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
      </B.Button>
      :
      <B.Button size="sm" variant="outline-primary"
        disabled={followUserMutation.isLoading}
        onClick={async () => {
          await followUserMutation.mutateAsync({ userId: props.user.id })
        }}>
        Follow
        {followUserMutation.isLoading && <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
      </B.Button>
  )
}

const ShowUser: WithPreload<NextPage<SuperJSONResult>> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { userId } = initialProps
  const { data: session } = useSession()

  const userQuery = useUser({ userId }, { initialData: initialProps?.user })
  const boardsQuery = useBoards({ users: [userId] }, { initialData: initialProps?.boards })

  if (userQuery.status === 'loading' || userQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (userQuery.status === 'error') return <B.Alert variant="danger">{userQuery.error as Error}</B.Alert>

  if (boardsQuery.status === 'loading' || boardsQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (boardsQuery.status === 'error') return <B.Alert variant="danger">{boardsQuery.error as Error}</B.Alert>

  const user = userQuery.data
  const boards = boardsQuery.data

  return (
    <>
      <Head>
        <title>{user.displayName} @{user.handle} / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={user} active />
      </B.Breadcrumb>

      <h1>
        <span className="me-3">{user.displayName}</span>
        <em>@{user.handle}</em>
        {/* TODO should show up even when the user isn't logged in */}
        {(user.followed !== null) &&
          <>
            <span className="ms-4" />
            <FollowButton user={user} />
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

ShowUser.getInitialProps = getInitialProps
ShowUser.preload = preload

export default ShowUser
