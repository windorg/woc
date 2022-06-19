import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Card } from '@prisma/client'
import { cardSettings } from '../lib/model-settings'
import * as B from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb } from '../components/breadcrumbs'
import { CardCard } from '../components/cardCard'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { getSession } from 'next-auth/react'
import { serialize, deserialize } from 'superjson'
import { SuperJSONResult } from 'superjson/dist/types'
import { BoardActions } from 'components/boardActions'
import { AddCardForm } from 'components/addCardForm'
import { useRouter } from 'next/router'
import { GetBoardData, serverGetBoard } from './api/boards/get'
import { PreloadContext, WithPreload } from 'lib/link-preload'
import { boardsRoute } from 'lib/routes'
import { prefetchBoard, useBoard } from 'lib/queries/boards'
import { ListCardsData, serverListCards } from './api/cards/list'
import { prefetchCards, useCards } from 'lib/queries/cards'
import { SocialTags } from 'components/socialTags'
import { CardsList } from 'components/cardsList'
import { EditBoardModal } from 'components/editBoardModal'
import { sortByIdOrder } from 'lib/array'
import { isNextExport } from 'lib/export'

type Props = {
  boardId: Card['id']
  board?: GetBoardData
  cards?: ListCardsData
}

async function preload(context: PreloadContext): Promise<void> {
  const boardId = context.query.boardId as string
  await Promise.all([
    prefetchBoard(context.queryClient, { boardId }),
    prefetchCards(context.queryClient, { boards: [boardId] }),
  ])
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const boardId = context.query.boardId as string
  const props: Props = {
    boardId,
  }
  // Server-side, we want to fetch the data so that we can SSR the page. Client-side, we assume the data is either
  // already preloaded or will be loaded in the component itself, so we don't fetch the board.
  if (typeof window === 'undefined') {
    if (!isNextExport(context)) {
      const session = await getSession(context)
      await serverGetBoard(session, { boardId })
        .then(result => { if (result.success) props.board = result.data })
      await serverListCards(session, { boards: [boardId] })
        .then(result => { if (result.success) props.cards = result.data })
    }
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
  const cardsQuery = useCards({ boards: [boardId] }, { initialData: initialProps?.cards })

  if (boardQuery.status === 'loading' || boardQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (boardQuery.status === 'error') return <B.Alert variant="danger">{(boardQuery.error as Error).message}</B.Alert>

  if (cardsQuery.status === 'loading' || cardsQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (cardsQuery.status === 'error') return <B.Alert variant="danger">{(cardsQuery.error as Error).message}</B.Alert>

  const board = boardQuery.data
  const cards = cardsQuery.data

  const isPrivate = cardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      sortByIdOrder(cards, board.childrenOrder, { onMissingElement: 'skip' }),
      card => (!cardSettings(card).archived)
    )

  return (
    <>
      <Head>
        <title>{board.title} / WOC</title>
      </Head>
      <SocialTags
        title={board.title}
        description={`by @${board.owner.handle}`}
      />

      <B.Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={board.owner} />
        <BoardCrumb board={board} active />
      </B.Breadcrumb>

      {board.canEdit &&
        <EditBoardModal
          board={board}
          show={editing}
          onHide={() => setEditing(false)}
          afterSave={() => setEditing(false)}
        />
      }

      <h1>
        {isPrivate ? "🔒 " : ""}
        {board.title}
      </h1>

      <div className="mb-5" style={{ marginTop: "calc(0.9rem + 0.3vw)", fontSize: "calc(0.9rem + 0.3vw)" }}>
        <BoardActions
          board={board}
          onEdit={() => setEditing(true)}
          afterDelete={async () => router.replace(boardsRoute())}
        />
      </div>

      {board.canEdit && <AddCardForm parentId={board.id} />}

      <div style={{ marginTop: "30px" }}>
        <CardsList parentId={board.id} cards={normalCards} allowEdit={board.canEdit} />
      </div>
      {
        (archivedCards.length > 0) &&
        <B.Accordion className="mt-5">
          <B.Accordion.Item eventKey="0">
            <B.Accordion.Header>
              <B.Badge bg="secondary">Archived cards</B.Badge>
            </B.Accordion.Header>
            <B.Accordion.Body>
              <CardsList parentId={board.id} cards={archivedCards} allowEdit={board.canEdit} />
            </B.Accordion.Body>
          </B.Accordion.Item>
        </B.Accordion>
      }
    </>
  )
}

ShowBoard.getInitialProps = getInitialProps
ShowBoard.preload = preload

export default ShowBoard
