import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React from 'react'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import { PreloadContext, WithPreload } from 'lib/link-preload'
import { ListBoardsData, serverListBoards } from './api/boards/list'
import { prefetchBoards, useBoards } from 'lib/queries/boards'
import { isNextExport } from 'lib/export'

type Props = {
  boards?: ListBoardsData
}

async function preload(context: PreloadContext): Promise<void> {
  await prefetchBoards(context.queryClient, {})
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {}
  // Server-side, we want to fetch the data so that we can SSR the page. Client-side, we assume the data is either
  // already preloaded or will be loaded in the component itself, so we don't fetch anything.
  if (typeof window === 'undefined') {
    if (!isNextExport(context)) {
      const session = await getSession(context)
      await serverListBoards(session, {})
        .then(result => { if (result.success) props.boards = result.data })
    }
  }
  return serialize(props)
}

const Boards: WithPreload<NextPage<SuperJSONResult>> = (serializedInitialProps) => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null
  const initialProps = deserialize<Props>(serializedInitialProps)

  const boardsQuery = useBoards({}, { initialData: initialProps?.boards })

  if (boardsQuery.status === 'loading' || boardsQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (boardsQuery.status === 'error')
    return <B.Alert variant="danger">{(boardsQuery.error as Error).message}</B.Alert>

  const boards = boardsQuery.data

  const [userBoards, otherBoards] =
    userId
      ? _.partition(boards, board => board.ownerId === userId)
      : [[], boards]

  return (
    <>
      <Head>
        <title>Boards / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb active />
      </B.Breadcrumb>

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
Boards.preload = preload

export default Boards
