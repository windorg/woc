import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card } from '@prisma/client'
import { prisma } from '../lib/db'
import { boardSettings, cardSettings } from '../lib/model-settings'
import { Accordion, Badge, Breadcrumb, Card as BSCard } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb } from '../components/breadcrumbs'
import React from 'react'
import Link from 'next/link'
import _ from 'lodash'

type Card_ = Card & { _count: { cardUpdates: number } }
type Board_ = Board & { owner: User, cards: Card_[] }

// TODO: handle both logged-in and logged-out cases
type Props = {
  board: Board_
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
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
    props: {
      board
    }
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

const ShowBoard: NextPage<Props> = ({ board }) => {
  const isPrivate = boardSettings(board).visibility === 'private'
  const [normalCards, archivedCards] = _.partition(board.cards, card => (!cardSettings(card).archived))
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
      {/* TODO when editable (renderCardAddForm board) */}
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
