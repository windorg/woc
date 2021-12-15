import type { GetServerSideProps, NextPage } from 'next'
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
import update from 'immutability-helper'
import { BiPencil } from 'react-icons/bi'
import { EditBoardModal } from 'components/editBoardModal'
import { BoardMenu } from 'components/boardMenu'
import { useRouter } from 'next/router'

type Card_ = Card & { _count: { comments: number } }
type Board_ = Board & { owner: User, cards: Card_[], canEdit: boolean }

type Props = {
  userId: User['id'] | null
  board: Board_
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  let board = await prisma.board.findUnique({
    where: {
      id: context.query.boardId as string
    },
    include: {
      owner: true,
      cards: {
        include: {
          _count: { select: { comments: true } }
        }
      }
    }
  })
  if (!board || !(await canSeeBoard(session?.userId, board))) { return { notFound: true } }
  const props: Props = {
    userId: session?.userId,
    board: { ...board, canEdit: await canEditBoard(session?.userId, board) },
  }
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

const ShowBoard: NextPage<SuperJSONResult> = (props) => {
  const { board: initialBoard } = deserialize<Props>(props)

  const [cards, setCards] = useState(initialBoard.cards)
  const addCard = (card: Card) => {
    const card_ = { ...card, _count: { comments: 0 } }
    setCards(prevCards => update(prevCards, { $push: [card_] }))
  }

  const [board, setBoard] = useState(_.omit(initialBoard, ['cards']))

  const [editing, setEditing] = useState(false)

  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      _.orderBy(cards, ['createdAt'], ['desc']),
      card => (!cardSettings(card).archived))

  const router = useRouter()

  const EditButton = () => (
    <span
      className="text-muted me-3 link-button d-inline-flex align-items-center"
      onClick={() => setEditing(true)}>
      <BiPencil className="me-1" /><span>Edit</span>
    </span>
  )

  const MoreButton = () => (
    <BoardMenu
      board={board}
      afterBoardUpdated={board => setBoard(prev => ({ ...prev, ...board }))}
      afterBoardDeleted={() => router.replace(`/Boards`)} />
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
          {board.canEdit && <EditButton />}
          <MoreButton />
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

export default ShowBoard
