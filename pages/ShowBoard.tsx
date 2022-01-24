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
import { unsafeCanSee } from 'lib/access'
import { useQueryOnce } from 'lib/react-query'
import { boardsRoute } from 'lib/routes'

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

function ShowBoardLoaded(props: { initialBoard: Extract<GetBoardResponse, { success: true }>['data'] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const { initialBoard } = props

  const [cards, setCards] = useState(initialBoard.cards)
  const addCard = (card: Card) => {
    // You can see things that you already have
    const card_ = unsafeCanSee({ ...card, _count: { comments: 0 } })
    setCards(cards => (cards.concat([card_])))
  }

  const [board, setBoard] = useState(_.omit(initialBoard, ['cards']))

  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      _.orderBy(cards, ['createdAt'], ['desc']),
      card => (!cardSettings(card).archived))

  const moreButton = () => (
    <BoardMenu
      board={board}
      afterBoardUpdated={board => setBoard(prev => ({ ...prev, ...board }))}
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
            afterBoardUpdated={board => {
              setBoard(prev => ({ ...prev, ...board }))
              setEditing(false)
            }}
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

      {board.canEdit && <AddCardForm boardId={board.id} afterCardCreated={addCard} />}
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

const ShowBoard: NextPage<SuperJSONResult> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { boardId } = initialProps

  // We don't want to refetch the data in realtime — imagine reading the page and then new posts appear/disappear and
  // the page jumps around. We want the following:
  //
  //   * We show existing data (without a spinner even if the data is stale)
  //   * When the page has been displayed properly, we clear the cache — to preserve the property that shown data can
  //     *never* omit items that the user has already posted

  const queryClient = useQueryClient()
  if (initialProps.board) queryClient.setQueryData(getBoardKey(boardId), initialProps.board)
  const query = useQueryOnce(
    getBoardKey(boardId),
    async () => callGetBoard({ boardId })
  )
  // Erase the query cache whenever it's successfully loaded
  useEffect(() => {
    if (query.status !== 'loading') queryClient.setQueryData(getBoardKey(boardId), undefined)
  }, [query.status, boardId, queryClient])
  const renderData = (response: GetBoardResponse) => {
    if (response.success) return <ShowBoardLoaded initialBoard={response.data} />
    if (response.error.notFound) return <NextError statusCode={404} />
    return <NextError statusCode={500} />
  }
  if (query.status === 'loading') return <Spinner animation="border" />
  if (query.status === 'error') return <Alert variant="danger">Could not load the board: {query.error}</Alert>
  if (query.status === 'success') return renderData(query.data)
  return <Alert variant="danger">Could not load the board: unknown error</Alert>
}

ShowBoard.getInitialProps = getInitialProps
// @ts-expect-error: preload not found
ShowBoard.preload = preload

export default ShowBoard
