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
import { useReplies } from 'lib/queries/replies'
import { SocialTags } from 'components/socialTags'
import { MoveCardModal } from 'components/moveCardModal'
import { Subcards } from 'components/card/subcards'
import { Comments } from 'components/card/comments'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'
import { Query } from '@components/query'

const useGetCard = (variables: { id: string }) => {
  return useQuery(
    graphql(`
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
    `),
    { variables }
  )
}

const useGetComments = (variables: { cardId: string }) => {
  return useQuery(
    graphql(`
      query getComments($cardId: UUID!) {
        card(id: $cardId) {
          id
          comments {
            id
            content
            createdAt
            visibility
            pinned
            canEdit
          }
        }
      }
    `),
    { variables }
  )
}

const CardPage: NextPage = () => {
  const router = useRouter()

  const cardId = router.query.id as string

  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)

  const cardQuery = useGetCard({ id: cardId })
  const commentsQuery = useGetComments({ cardId })
  const repliesQuery = useReplies({ cards: [cardId] })

  return (
    <>
      <Query queries={{ cardQuery }}>
        {({ cardQuery: { card } }) => (
          <>
            {/* Page <head> */}
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

            {/* Breadcrumbs bar */}
            <B.Breadcrumb>
              <BoardsCrumb />
              <UserCrumb user={card.owner} />
              {card.parentChain.map((id) => (
                <CardCrumbFetch key={id} cardId={id} />
              ))}
              <CardCrumb card={card} active />
            </B.Breadcrumb>

            {/* Modals */}
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

            {/* Card title and tagline */}
            <h1>
              {card.archived && (
                <B.Badge bg="secondary" className="me-2">
                  Archived
                </B.Badge>
              )}
              {card.visibility === 'private' && '🔒 '}
              {card.title}
            </h1>
            {card.tagline && (
              <div>
                <span className="text-muted">{card.tagline}</span>
              </div>
            )}

            {/* Card actions */}
            <div
              className="mb-5"
              style={{ marginTop: 'calc(0.9rem + 0.3vw)', fontSize: 'calc(0.9rem + 0.3vw)' }}
            >
              <CardActions
                card={card}
                onEdit={() => setEditing(true)}
                onMove={() => setMoving(true)}
                afterDelete={async () =>
                  router.replace(card.parentId ? cardRoute(card.parentId) : boardsRoute())
                }
              />
            </div>

            {/* List of child cards */}
            <Subcards parent={card} cards={card.children} />
          </>
        )}
      </Query>

      {/* Comments and replies */}
      <Query queries={{ cardQuery, commentsQuery }}>
        {({
          cardQuery: { card },
          commentsQuery: {
            card: { comments },
          },
        }) => {
          // TODO we can show the comments before loading the replies
          if (repliesQuery.status === 'loading' || repliesQuery.status === 'idle')
            return (
              <div className="d-flex mt-5 justify-content-center">
                <B.Spinner animation="border" />
              </div>
            )
          if (repliesQuery.status === 'error')
            return <B.Alert variant="danger">{(repliesQuery.error as Error).message}</B.Alert>
          return <Comments card={card} comments={comments} replies={repliesQuery.data} />
        }}
      </Query>
    </>
  )
}

export default CardPage
