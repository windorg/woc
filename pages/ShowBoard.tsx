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
import { Formik, useFormik } from 'formik'
import update from 'immutability-helper'
import { callUpdateBoard } from './api/boards/update'
import { BiPencil } from 'react-icons/bi'

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

class EditBoard extends React.Component<{
  board: Board
  afterBoardUpdated: (newBoard: Board) => void
  stopEditing: () => void
}> {
  render() {
    const { board } = this.props
    const isPrivate = boardSettings(board).visibility == 'private'
    return (
      <Formik
        initialValues={{ private: isPrivate, title: board.title }}
        onSubmit={async (values) => {
          const diff = await callUpdateBoard({ boardId: board.id, ...values })
          this.props.stopEditing()
          this.props.afterBoardUpdated({ ...board, ...diff })
        }}
      >
        {props => (<>
          <Form onSubmit={props.handleSubmit} className="mt-4 mb-5 p-4 rounded"
            style={{ boxShadow: "0px 8px 50px 8px rgba(138,138,138,0.75)", maxWidth: "40rem" }}>
            <Form.Group className="mb-3">
              <Form.Control
                name="title" id="title" value={props.values.title} onChange={props.handleChange}
                type="text" placeholder="Board title"
                style={{ maxWidth: "40rem", width: "100%", fontWeight: 600 }} />
            </Form.Group>
            <Button size="sm" variant="primary" type="submit">Save</Button>
            <Button className="ms-2" size="sm" variant="secondary" type="button"
              onClick={this.props.stopEditing}>
              Cancel
            </Button>
            {/* TODO this should become an action instead */}
            <Form.Check
              name="private" id="private" checked={props.values.private} onChange={props.handleChange}
              className="ms-4" type="checkbox" inline label="🔒 Private board" />
            <p className="small text-muted mt-3">
              <em>Ultra Material Design™️.</em> I will fix this later.
            </p>
          </Form>
        </>)}
      </Formik>
    )
  }
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

  const EditButton = () => (
    <span
      className="ms-4 text-muted link-button d-inline-flex align-items-center"
      style={{ fontSize: "50%" }}
      onClick={() => setEditing(true)}>
      <BiPencil className="me-1" /><span>Edit</span>
    </span>
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

      {(board.canEdit && editing)
        ?
        <EditBoard
          board={board}
          afterBoardUpdated={board => setBoard(prev => ({ ...prev, ...board }))}
          stopEditing={() => setEditing(false)} />
        :
        <h1 style={{ marginBottom: "1em" }}>
          {isPrivate ? "🔒 " : ""}
          {board.title}
          <EditButton />
        </h1>
      }
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
