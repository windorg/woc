import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card } from '@prisma/client'
import { prisma } from '../lib/db'
import { boardSettings, cardSettings } from '../lib/model-settings'
import { Accordion, Badge, Breadcrumb, Button, Card as BSCard, Form } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb } from '../components/breadcrumbs'
import React, { useState } from 'react'
import Link from 'next/link'
import _ from 'lodash'
import { canEditBoard } from '../lib/access'
import { getSession } from 'next-auth/react'
import { serialize, deserialize } from 'superjson'
import { SuperJSONResult } from 'superjson/dist/types'
import { callCreateCard } from './api/cards/create'

type Card_ = Card & { _count: { cardUpdates: number } }
type Board_ = Board & { owner: User, cards: Card_[] }

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
          _count: { select: { cardUpdates: true } }
        }
      }
    }
  })
  if (!board) { return { notFound: true } }
  return {
    props: serialize({
      userId: session?.userId,
      board
    })
  }
}

function renderCard(card: Card_) {
  const isPrivate = cardSettings(card).visibility === 'private'
  return (
    <BSCard key={card.id} className={`mb-2 woc-card ${isPrivate ? "woc-card-private" : ""}`}>
      <BSCard.Body>
        {isPrivate ? "🔒 " : ""}
        <Link href={`/ShowCard?cardId=${card.id}`}><a className="stretched-link">{card.title}</a></Link>
        <Badge pill style={{ marginLeft: ".5em" }} bg="secondary">{card._count.cardUpdates}</Badge>
      </BSCard.Body>
    </BSCard >
  )
}

function CardAddForm(props: { addCard: (title: string) => Promise<void> }) {
  const [titleInput, setTitleInput] = useState('')
  const onSubmit = (e: any) => {
    e.preventDefault()
    // TODO: what exactly will happen in prod if this fails with err500?
    props.addCard(titleInput)
    setTitleInput('')
  }
  return <>
    <Form onSubmit={onSubmit}>
      <Form.Group className="mb-3" controlId="cardAddTitle">
        <Form.Control
          type="text" placeholder="Card title" style={{ maxWidth: "40rem", width: "100%" }}
          value={titleInput}
          onInput={e => setTitleInput((e.target as HTMLInputElement).value)} />
      </Form.Group>
      <Button variant="primary" type="submit">Add a card</Button>
      <Form.Check className="ms-4" inline id="cardPrivate" type="checkbox" label="🔒 Private card" />
    </Form>
  </>
}

const ShowBoard: NextPage<SuperJSONResult> = (props) => {
  const { userId, board } = deserialize<Props>(props)

  const [cards, setCards] = useState(board.cards)

  const addCard = async (title: Card['title']) => {
    const card = {
      ...await callCreateCard({ boardId: board.id, title }),
      _count: { cardUpdates: 0 }
    }
    console.log(card)
    setCards(_.concat(cards, [card]))
  }

  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] =
    _.partition(
      _.reverse(_.sortBy(cards, ['createdAt'])),
      card => (!cardSettings(card).archived))
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
      </h1>
      {canEditBoard(userId, board) && <CardAddForm addCard={addCard} />}
      <div style={{ marginTop: "30px" }}>
        {normalCards.map(renderCard)}
      </div>
      {(archivedCards.length > 0) &&
        <Accordion className="mt-5">
          <Accordion.Item eventKey="0">
            <Accordion.Header><Badge bg="secondary">Archived cards</Badge></Accordion.Header>
            <Accordion.Body>{archivedCards.map(renderCard)}</Accordion.Body>
          </Accordion.Item>
        </Accordion>}
    </>
  )
}

export default ShowBoard
