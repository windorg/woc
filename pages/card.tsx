import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import * as B from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, CardCrumb, CardCrumbFetch } from '../components/breadcrumbs'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { EditCardModal } from 'components/editCardModal'
import { CardActions } from 'components/cardActions'
import { useRouter } from 'next/router'
import { cardRoute, boardsRoute } from 'lib/routes'
import { useComments } from 'lib/queries/comments'
import { useReplies } from 'lib/queries/replies'
import { SocialTags } from 'components/socialTags'
import { MoveCardModal } from 'components/moveCardModal'
import { Subcards } from 'components/card/subcards'
import { Comments } from 'components/card/comments'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'

const _getCard = graphql(`
  query getCard($id: UUID!) {
    card(id: $id) {
      id
      title
      tagline
      visibility
      parentId
      canEdit
      archived
      reverseOrder
      parentChain
      childrenOrder
      children {
        id
        title
        visibility
        tagline
        archived
        commentCount
      }
      owner {
        id
        handle
      }
    }
  }
`)

const CardPage: NextPage = () => {
  const router = useRouter()

  const cardId = router.query.id as string

  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)

  const cardQuery = useQuery(_getCard, { variables: { id: cardId } })
  const commentsQuery = useComments({ cards: [cardId] })
  const repliesQuery = useReplies({ cards: [cardId] })

  // TODO all of this is boilerplate
  if (cardQuery.error) return <B.Alert variant="danger">{cardQuery.error.message}</B.Alert>
  if (!cardQuery.data)
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )

  if (commentsQuery.status === 'loading' || commentsQuery.status === 'idle')
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )
  if (commentsQuery.status === 'error')
    return <B.Alert variant="danger">{(commentsQuery.error as Error).message}</B.Alert>

  // TODO we can show the comments before loading the replies
  if (repliesQuery.status === 'loading' || repliesQuery.status === 'idle')
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )
  if (repliesQuery.status === 'error')
    return <B.Alert variant="danger">{(repliesQuery.error as Error).message}</B.Alert>

  const card = cardQuery.data.card
  const comments = commentsQuery.data
  const replies = repliesQuery.data

  const isPrivate = card.visibility === 'private'

  return (
    <>
      <Head>
        <title>{card.title} / WOC</title>
      </Head>
      <SocialTags
        title={card.title}
        description={
          card.tagline
            ? `${card.tagline}\n\n— by @${card.owner.handle}`
            : `— by @${card.owner.handle}`
        }
      />

      <B.Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={card.owner} />
        {card.parentChain.map((id) => (
          <CardCrumbFetch key={id} cardId={id} />
        ))}
        <CardCrumb card={card} active />
      </B.Breadcrumb>

      {card.canEdit && (
        <>
          <EditCardModal
            card={card}
            show={editing}
            onHide={() => setEditing(false)}
            afterSave={() => setEditing(false)}
          />
          <MoveCardModal
            card={card}
            show={moving}
            onHide={() => setMoving(false)}
            afterMove={() => setMoving(false)}
          />
        </>
      )}

      <h1>
        {card.archived && (
          <B.Badge bg="secondary" className="me-2">
            Archived
          </B.Badge>
        )}
        {isPrivate && '🔒 '}
        {card.title}
      </h1>

      {card.tagline && (
        <div>
          <span className="text-muted">{card.tagline}</span>
        </div>
      )}

      <div
        className="mb-5"
        style={{ marginTop: 'calc(0.9rem + 0.3vw)', fontSize: 'calc(0.9rem + 0.3vw)' }}
      >
        <CardActions
          card={card}
          onEdit={() => setEditing(true)}
          onMove={() => setMoving(true)}
          afterDelete={async () => {
            if (card.parentId) {
              await router.replace(cardRoute(card.parentId))
            } else {
              await router.replace(boardsRoute())
            }
          }}
        />
      </div>

      <Subcards parent={card} cards={card.children} />

      <Comments card={card} comments={comments} replies={replies} />
    </>
  )
}

export default CardPage
