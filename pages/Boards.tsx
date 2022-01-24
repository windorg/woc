import type { GetServerSideProps, NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useEffect, useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn, useSession } from 'next-auth/react'
import { CanSee, canSeeBoard, unsafeCanSee } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { filterAsync, filterSync } from 'lib/array'
import _, { isNull } from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import assert from 'assert'
import { PreloadContext } from 'lib/link-preload'
import { callListBoards, ListBoardsResponse, serverListBoards } from './api/boards/list'
import { useQueryClient } from 'react-query'
import { useQueryOnce } from 'lib/react-query'
import { callGetUser, GetUserResponse, serverGetUser } from './api/users/get'
import NextError from 'next/error'

type Board_ = CanSee & Board & { owner: { handle: string, displayName: string } }

type Props = {
  user: GetUserResponse | null
  boards: ListBoardsResponse | null
}

const listBoardsKey = () => ['listBoards']
const getUserKey = (userId: string) => ['getUser', { userId }]

async function preload(context: PreloadContext): Promise<void> {
  if (context.session) {
    const userId = context.session.userId
    await context.queryClient.prefetchQuery(
      getUserKey(userId),
      async () => callGetUser({ userId })
    )
  }
  await context.queryClient.prefetchQuery(
    listBoardsKey(),
    async () => callListBoards()
  )
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {
    user: null,
    boards: null
  }
  // Server-side, we want to fetch the data so that we can SSR the page. Client-side, we assume the data is either
  // already preloaded or will be loaded in the component itself, so we don't fetch anything.
  if (typeof window === 'undefined') {
    const session = await getSession(context)
    if (session?.userId) props.user = await serverGetUser(session, { userId: session.userId })
    props.boards = await serverListBoards(session)
  }
  return serialize(props)
}

const BoardsLoaded = (props: {
  initialListBoards: ListBoardsResponse['data']
  initialGetUser: Extract<GetUserResponse, { success: true }>['data'] | null
}) => {
  const user = props.initialGetUser
  const [initialUserBoards, otherBoards] =
    user
      ? _.partition(props.initialListBoards, board => board.ownerId === user.id)
      : [[], props.initialListBoards]

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

const Boards: NextPage<SuperJSONResult> = (props) => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null
  const initialProps = deserialize<Props>(props)

  const queryClient = useQueryClient()

  // TODO: this has to be written for each query. Perhaps it could be moved into the endpoint files.
  if (initialProps.user && userId) queryClient.setQueryData(getUserKey(userId), initialProps.user)
  const getUserQuery = useQueryOnce(
    getUserKey(userId ?? ''),
    async () => userId ? callGetUser({ userId }) : Promise.resolve(null)
  )
  if (initialProps.boards) queryClient.setQueryData(listBoardsKey(), initialProps.boards)
  const listBoardsQuery = useQueryOnce(
    listBoardsKey(),
    async () => callListBoards()
  )

  // Erase the query cache whenever it's successfully loaded
  useEffect(() => {
    if (getUserQuery.status !== 'loading') queryClient.setQueryData(getUserKey(userId ?? ''), undefined)
  }, [getUserQuery.status, userId, queryClient])
  useEffect(() => {
    if (listBoardsQuery.status !== 'loading') queryClient.setQueryData(listBoardsKey(), undefined)
  }, [listBoardsQuery.status, queryClient])

  const renderData = (listBoards: ListBoardsResponse, getUser: GetUserResponse | null) => {
    if (listBoards.success && (getUser === null || getUser.success))
      return <BoardsLoaded initialListBoards={listBoards.data} initialGetUser={getUser ? getUser.data : null} />
    if (getUser && !getUser.success && getUser.error.notFound) return <NextError statusCode={404} />
    return <NextError statusCode={500} />
  }
  if (listBoardsQuery.status === 'loading' || getUserQuery.status === 'loading')
    return <B.Spinner animation="border" />
  if (listBoardsQuery.status === 'error')
    return <B.Alert variant="danger">Could not load boards: {listBoardsQuery.error}</B.Alert>
  if (getUserQuery.status === 'error')
    return <B.Alert variant="danger">Could not load the current user: {getUserQuery.error}</B.Alert>
  if (listBoardsQuery.status === 'success' && getUserQuery.status === 'success')
    return renderData(listBoardsQuery.data, getUserQuery.data)
  return <B.Alert variant="danger">Could not load the boards: unknown error</B.Alert>
}

Boards.getInitialProps = getInitialProps
// @ts-expect-error: preload not found
Boards.preload = preload

export default Boards
