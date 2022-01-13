import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, User, Card } from '@prisma/client'
import { prisma } from '../lib/db'
import { boardSettings, cardSettings } from '../lib/model-settings'
import { Accordion, Badge, Breadcrumb, Button, Card as BSCard, Form } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb } from '../components/breadcrumbs'
import { CardCard } from '../components/cardCard'
import React, { useState } from 'react'
import _ from 'lodash'
import { canEditBoard, canSeeBoard } from '../lib/access'
import { getSession } from 'next-auth/react'
import { serialize, deserialize } from 'superjson'
import { SuperJSONResult } from 'superjson/dist/types'
import { callCreateCard } from './api/cards/create'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { useFormik } from 'formik'
import { BiPencil } from 'react-icons/bi'
import { EditBoardModal } from 'components/editBoardModal'
import { BoardMenu } from 'components/boardMenu'
import { useRouter } from 'next/router'
import { LinkButton } from 'components/linkButton'
import { PageWithControl, WithControl } from 'lib/props-control'
import { callGetBoard, GetBoardResponse, serverGetBoard } from './api/boards/get'

type Props = {
  board: GetBoardResponse
}

// OK, what do we want?
//
// * On the client, we want 1) to make API requests to the server and 2) cache them (later).
// * In next/link, we want to call the component's getInitialProps during prefetch.
// * On the server, we want to make direct requests.

async function getInitialProps(context: NextPageContext): Promise<WithControl<SuperJSONResult>> {
  const response = typeof window === 'undefined'
    ? await serverGetBoard(await getSession(context), { boardId: context.query.boardId as string })
    : await callGetBoard({ boardId: context.query.boardId as string })
  if (!response) return { notFound: true }
  const props: Props = { board: response }
  return { props: serialize(props) }
}

function AddCardForm(props: {
  boardId: Board['id']
  afterCardCreated: (card: Card) => void
}) {
  const formik = useFormik({
    initialValues: {
      title: '',
      private: false,
    },
    onSubmit: async (values) => {
      // TODO: what exactly will happen in prod if the backend fails with err500 for whatever reason?
      const card = await callCreateCard({
        boardId: props.boardId,
        ...values
      })
      props.afterCardCreated(card)
      formik.resetForm()
    }
  })
  return (
    <Form onSubmit={formik.handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Control
          name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
          type="text" placeholder="Card title"
          style={{ maxWidth: "40rem", width: "100%" }} />
      </Form.Group>
      <Button variant="primary" type="submit">Add a card</Button>
      <Form.Check
        name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
        type="checkbox" className="ms-4" inline label="🔒 Private card" />
    </Form>
  )
}

const ShowBoard: NextPage<SuperJSONResult, WithControl<SuperJSONResult>> = (props) => {
  const { board: initialBoard } = deserialize<Props>(props)

  const [cards, setCards] = useState(initialBoard.cards)
  const addCard = (card: Card) => {
    const card_ = { ...card, _count: { comments: 0 } }
    setCards(cards => (cards.concat([card_])))
  }

  const [board, setBoard] = useState(_.omit(initialBoard, ['cards']))

  const [editing, setEditing] = useState(false)

  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      _.orderBy(cards, ['createdAt'], ['desc']),
      card => (!cardSettings(card).archived))

  const router = useRouter()

  const moreButton = () => (
    <BoardMenu
      board={board}
      afterBoardUpdated={board => setBoard(prev => ({ ...prev, ...board }))}
      afterBoardDeleted={async () => router.replace(`/Boards`)} />
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

ShowBoard.getInitialProps = getInitialProps

export default PageWithControl(ShowBoard)
