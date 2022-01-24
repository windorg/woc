import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, Card } from '@prisma/client'
import { boardSettings, cardSettings } from '../lib/model-settings'
import { Accordion, Alert, Badge, Breadcrumb, Card as BSCard, Spinner } from 'react-bootstrap'
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
import { callGetBoard, GetBoardResponse, serverGetBoard } from './api/boards/get'
import { PreloadContext } from 'lib/link-preload'
import { useQueryClient } from 'react-query'
import NextError from 'next/error'
import { boardsRoute } from 'lib/routes'
import { useBoard } from 'lib/queries/board'

type Props = {
  boardId: Board['id']
  // The following are only available when the page is rendered server-side
  board: GetBoardResponse | null
}

const getBoardKey = (boardId: string) => ['getBoard', { boardId }]

async function preload(context: PreloadContext): Promise<void> {
  const boardId = context.query.boardId as string
  await context.queryClient.prefetchQuery(
    getBoardKey(boardId),
    async () => callGetBoard({ boardId })
  )
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const boardId = context.query.boardId as string
  const props: Props = {
    boardId,
    board: null
  }
  // Server-side, we want to fetch the data so that we can SSR the page. Client-side, we assume the data is either
  // already preloaded or will be loaded in the component itself, so we don't fetch the board.
  if (typeof window === 'undefined')
    props.board = await serverGetBoard(await getSession(context), { boardId })
  return serialize(props)
}

const ShowBoard: NextPage<SuperJSONResult> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { boardId } = initialProps

  const queryClient = useQueryClient()
  // TODO properly this should be passed to useBoard
  if (initialProps.board) queryClient.setQueryData(getBoardKey(boardId), initialProps.board)

  const router = useRouter()
  const [editing, setEditing] = useState(false)

  // We don't want to refetch the data in realtime — imagine reading the page and then new posts appear/disappear and the page jumps around. We show
  // existing data (without a spinner even if the data is stale). Under the hood 'useBoard' only ever updates once.
  const boardQuery = useBoard({ boardId })

  if (boardQuery.status === 'loading' || boardQuery.status === 'idle') return <Spinner animation="border" />
  if (boardQuery.status === 'error') return <Alert variant="danger">Could not load the board: {boardQuery.error}</Alert>
  if (!boardQuery.data.success) return <NextError statusCode={404} />

  const board = boardQuery.data.data

  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      _.orderBy(board.cards, ['createdAt'], ['desc']),
      card => (!cardSettings(card).archived))

  const moreButton = () => (
    <BoardMenu
      board={board}
      afterBoardDeleted={async () => router.replace(boardsRoute())} />
  )

  return (
    <>
      <Head>
        {/* TODO OG/Twitter tags */}
        <title>{board.title} / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={board.owner} />
        <BoardCrumb board={board} active />
      </Breadcrumb>

      <h1 style={{ marginBottom: "1em" }}>
        {isPrivate ? "🔒 " : ""}
        {board.title}
        {board.canEdit &&
          <EditBoardModal
            board={board}
            show={editing}
            onHide={() => setEditing(false)}
            afterBoardUpdated={() => setEditing(false)}
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
        <Accordion className="mt-5">
          <Accordion.Item eventKey="0">
            <Accordion.Header><Badge bg="secondary">Archived cards</Badge></Accordion.Header>
            <Accordion.Body>{archivedCards.map(card => (<CardCard key={card.id} card={card} />))}</Accordion.Body>
          </Accordion.Item>
        </Accordion>
      }
    </>
  )




}

ShowBoard.getInitialProps = getInitialProps
// @ts-expect-error: preload not found
ShowBoard.preload = preload

export default ShowBoard
