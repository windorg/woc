import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, Card } from '@prisma/client'
import { boardSettings, cardSettings } from '../lib/model-settings'
import * as B from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb } from '../components/breadcrumbs'
import { CardCard } from '../components/cardCard'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { getSession } from 'next-auth/react'
import { serialize, deserialize } from 'superjson'
import { SuperJSONResult } from 'superjson/dist/types'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { BiPencil } from 'react-icons/bi'
import { EditBoardModal } from 'components/editBoardModal'
import { BoardMenu } from 'components/boardMenu'
import { AddCardForm } from 'components/addCardForm'
import { useRouter } from 'next/router'
import { LinkButton } from 'components/linkButton'
import { GetBoardData, serverGetBoard } from './api/boards/get'
import { PreloadContext, WithPreload } from 'lib/link-preload'
import { boardsRoute } from 'lib/routes'
import { prefetchBoard, useBoard } from 'lib/queries/boards'

type Props = {
  boardId: Board['id']
  board?: GetBoardData
}

async function preload(context: PreloadContext): Promise<void> {
  const boardId = context.query.boardId as string
  await prefetchBoard(context.queryClient, { boardId })
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const boardId = context.query.boardId as string
  const props: Props = {
    boardId,
  }
  // Server-side, we want to fetch the data so that we can SSR the page. Client-side, we assume the data is either
  // already preloaded or will be loaded in the component itself, so we don't fetch the board.
  if (typeof window === 'undefined') {
    const session = await getSession(context)
    await serverGetBoard(session, { boardId })
      .then(result => { if (result.success) props.board = result.data })

  }
  return serialize(props)
}

const ShowBoard: WithPreload<NextPage<SuperJSONResult>> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { boardId } = initialProps

  const router = useRouter()
  const [editing, setEditing] = useState(false)

  // We don't want to refetch the data in realtime — imagine reading the page and then new posts appear/disappear and the page jumps around. We show
  // existing data (without a spinner even if the data is stale). Under the hood 'useBoard' only ever updates once.
  const boardQuery = useBoard({ boardId }, { initialData: initialProps?.board })

  if (boardQuery.status === 'loading' || boardQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (boardQuery.status === 'error') return <B.Alert variant="danger">{(boardQuery.error as Error).message}</B.Alert>

  const board = boardQuery.data

  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      _.orderBy(board.cards, ['createdAt'], ['desc']),
      card => (!cardSettings(card).archived))

  const moreButton = () => (
    <BoardMenu
      board={board}
      afterDelete={async () => router.replace(boardsRoute())} />
  )

  return (
    <>
      <Head>
        {/* TODO OG/Twitter tags */}
        <title>{board.title} / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={board.owner} />
        <BoardCrumb board={board} active />
      </B.Breadcrumb>

      <h1 style={{ marginBottom: "1em" }}>
        {isPrivate ? "🔒 " : ""}
        {board.title}
        {board.canEdit &&
          <EditBoardModal
            board={board}
            show={editing}
            onHide={() => setEditing(false)}
            afterSave={() => setEditing(false)}
          />
        }
        <span
          className="ms-5"
          style={{ fontSize: "50%" }}
        >
          {board.canEdit && <>
            <LinkButton onClick={() => setEditing(true)} icon={<BiPencil />}>Edit</LinkButton>
            <span className="me-3" />
          </>}
          {moreButton()}
        </span>
      </h1>

      {board.canEdit && <AddCardForm boardId={board.id} />}
      <div style={{ marginTop: "30px" }}>
        <TransitionGroup>
          {normalCards.map(card => (
            <CSSTransition key={card.id} timeout={350} classNames="woc-card">
              <CardCard card={card} />
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
      {(archivedCards.length > 0) &&
        <B.Accordion className="mt-5">
          <B.Accordion.Item eventKey="0">
            <B.Accordion.Header><B.Badge bg="secondary">Archived cards</B.Badge></B.Accordion.Header>
            <B.Accordion.Body>{archivedCards.map(card => (<CardCard key={card.id} card={card} />))}</B.Accordion.Body>
          </B.Accordion.Item>
        </B.Accordion>
      }
    </>
  )
}

ShowBoard.getInitialProps = getInitialProps
ShowBoard.preload = preload

export default ShowBoard
