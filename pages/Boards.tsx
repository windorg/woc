import type { GetServerSideProps, NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import React from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn, useSession } from 'next-auth/react'
import { CanSee, canSeeBoard, unsafeCanSee } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import { PreloadContext } from 'lib/link-preload'
import { ListBoardsResponse, serverListBoards } from './api/boards/list'
import { prefetchBoards, useBoards } from 'lib/queries/boards'

type Board_ = CanSee & Board & { owner: { handle: string, displayName: string } }

type Props = {
  boards: ListBoardsResponse | null
}

async function preload(context: PreloadContext): Promise<void> {
  await prefetchBoards(context.queryClient, {})
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {
    boards: null
  }
  // Server-side, we want to fetch the data so that we can SSR the page. Client-side, we assume the data is either
  // already preloaded or will be loaded in the component itself, so we don't fetch anything.
  if (typeof window === 'undefined') {
    const session = await getSession(context)
    props.boards = await serverListBoards(session, {})
  }
  return serialize(props)
}

const Boards: NextPage<SuperJSONResult> = (serializedInitialProps) => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null
  const initialProps = deserialize<Props>(serializedInitialProps)

  const boardsQuery = useBoards({}, { initialData: initialProps.boards ?? undefined })

  if (boardsQuery.status === 'loading' || boardsQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (boardsQuery.status === 'error')
    return <B.Alert variant="danger">Could not load boards: {boardsQuery.error}</B.Alert>

  const boards = boardsQuery.data.data

  const [userBoards, otherBoards] =
    userId
      ? _.partition(boards, board => board.ownerId === userId)
      : [[], boards]

  return (
    <>
      <Head>
        <title>Boards / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb active />
      </Breadcrumb>

      {userId
        ?
        <>
          <BoardsList
            allowNewBoard={true}
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

Boards.getInitialProps = getInitialProps
// @ts-expect-error: preload not found
Boards.preload = preload

export default Boards
