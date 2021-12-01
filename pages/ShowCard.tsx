import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, CardUpdate } from '@prisma/client'
import { prisma } from '../lib/db'
import { cardSettings, cardUpdateSettings } from '../lib/model-settings'
import { Badge, Breadcrumb } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb, CardCrumb } from '../components/breadcrumbs'
import React from 'react'
import Link from 'next/link'
import _ from 'lodash'
import { renderMarkdown } from '../lib/markdown'

type Card_ = Card & { owner: User, board: Board, cardUpdates: CardUpdate[] }

// TODO: handle both logged-in and logged-out cases
type Props = {
  card: Card_
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  let card = await prisma.card.findUnique({
    where: {
      id: context.query.cardId as string
    },
    include: {
      owner: true,
      board: true,
      cardUpdates: true
    }
  })
  if (!card) { return { notFound: true } }
  return {
    props: {
      card
    }
  }
}

function renderCardUpdate(card: Card, cardUpdate: CardUpdate) {
  const settings = cardUpdateSettings(cardUpdate)
  const isPrivate = settings.visibility === 'private'
  const cardClasses =
    "woc-card-update" +
    (isPrivate ? " woc-card-update-private" : "") +
    (settings.pinned ? " woc-card-update-pinned" : "")
  return (
    <div key={cardUpdate.id} id={`comment-${cardUpdate.id}`} className={cardClasses}>
      <div style={{ marginBottom: ".3em" }}>
        <span className="text-muted small">
          <Link href={`/ShowCard?cardId=${card.id}#comment-${cardUpdate.id}`}>
            <a>timestamp {/* TODO <a>{renderTimestamp(cardUpdate.createdAt)}</a> */}</a>
          </Link>
        </span>
        {isPrivate && "🔒 "}
        <div className="ms-3 d-inline-flex">
          {/* TODO render comment buttons */}
        </div>
      </div>
      <div className="rendered-content">
        {renderMarkdown(cardUpdate.content)}
      </div>
      {/* TODO render replies */}
    </div>
  )
}

const ShowCard: NextPage<Props> = ({ card }) => {
  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'
  const [pinnedUpdates, otherUpdates] = _.partition(card.cardUpdates, update => cardUpdateSettings(update).pinned)
  const reverseOrderUpdates =
    <>
      <p className="text-muted small">Comment order: oldest to newest.</p>
      <div className="mb-3">
        {_.concat(_.reverse(pinnedUpdates), _.reverse(otherUpdates))
          .map(update => renderCardUpdate(card, update))}
      </div>
      {/* TODO when(get #editable cardV)(renderCardUpdateAddForm card) */}
    </>
  const normalOrderUpdates =
    <>
      {/* TODO when(get #editable cardV)(renderCardUpdateAddForm card) */}
      <div className="mt-4">
        {_.concat(pinnedUpdates, otherUpdates)
          .map(update => renderCardUpdate(card, update))}
      </div>
    </>
  return (
    <>
      <Head>
        {/* TODO OG/Twitter tags */}
        <title>{card.title} / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={card.owner} />
        <BoardCrumb board={card.board} />
        <CardCrumb card={card} active />
      </Breadcrumb>

      <h1 className="mb-4">
        {cardSettings(card).archived && <Badge bg="secondary" className="me-2">Archived</Badge>}
        {isPrivate && "🔒 "}
        {card.title}
        {/* card edit & delete buttons */}
      </h1>
      {settings.reverseOrder ? reverseOrderUpdates : normalOrderUpdates}
    </>
  )
}

export default ShowCard