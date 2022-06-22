import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { User, Card, Comment, Reply } from '@prisma/client'
import { cardSettings, commentSettings } from '../lib/model-settings'
import * as B from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, CardCrumb, CardCrumbFetch } from '../components/breadcrumbs'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { getSession } from 'next-auth/react'
import { EditCardModal } from 'components/editCardModal'
import { CardActions } from 'components/cardActions'
import { useRouter } from 'next/router'
import { cardRoute, boardsRoute } from 'lib/routes'
import { GetCardData, serverGetCard } from './api/cards/get'
import { ListCommentsData, serverListComments } from './api/comments/list'
import { ListRepliesData, serverListReplies } from './api/replies/list'
import { PreloadContext, WithPreload } from 'lib/link-preload'
import { prefetchCard, prefetchCards, useCard, useCards } from 'lib/queries/cards'
import { prefetchComments, useComments } from 'lib/queries/comments'
import { prefetchReplies, useReplies } from 'lib/queries/replies'
import { SocialTags } from 'components/socialTags'
import { MoveCardModal } from 'components/moveCardModal'
import { isNextExport } from 'lib/export'
import { ListCardsData, serverListCards } from './api/cards/list'
import { Subcards } from 'components/card/subcards'
import { Comments } from 'components/card/comments'

type Props = {
  cardId: Card['id']
  card?: GetCardData
  children?: ListCardsData
  comments?: ListCommentsData
  replies?: ListRepliesData
}

async function preload(context: PreloadContext): Promise<void> {
  const cardId = context.query.id as string
  await Promise.all([
    prefetchCard(context.queryClient, { cardId }),
    prefetchCards(context.queryClient, { parents: [cardId] }),
    prefetchComments(context.queryClient, { cards: [cardId] }),
    prefetchReplies(context.queryClient, { cards: [cardId] })
  ])
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const cardId = context.query.id as string
  const props: Props = { cardId }
  if (typeof window === 'undefined') {
    if (!isNextExport(context)) {
      const session = await getSession(context)
      await serverGetCard(session, { cardId })
        .then(result => { if (result.success) props.card = result.data })
      await serverListCards(session, { parents: [cardId] })
        .then(result => { if (result.success) props.children = result.data })
      await serverListComments(session, { cards: [cardId] })
        .then(result => { if (result.success) props.comments = result.data })
      await serverListReplies(session, { cards: [cardId] })
        .then(result => { if (result.success) props.replies = result.data })
    }
  }
  return serialize(props)
}

const CardPage: WithPreload<NextPage<SuperJSONResult>> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { cardId } = initialProps

  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)

  const cardQuery = useCard({ cardId }, { initialData: initialProps.card })
  const childrenQuery = useCards({ parents: [cardId] }, { initialData: initialProps.children })
  const commentsQuery = useComments({ cards: [cardId] }, { initialData: initialProps.comments })
  const repliesQuery = useReplies({ cards: [cardId] }, { initialData: initialProps.replies })

  // TODO all of this is boilerplate
  if (cardQuery.status === 'loading' || cardQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (cardQuery.status === 'error') return <B.Alert variant="danger">{(cardQuery.error as Error).message}</B.Alert>

  if (childrenQuery.status === 'loading' || childrenQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (childrenQuery.status === 'error') return <B.Alert variant="danger">{(childrenQuery.error as Error).message}</B.Alert>

  if (commentsQuery.status === 'loading' || commentsQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (commentsQuery.status === 'error') return <B.Alert variant="danger">{(commentsQuery.error as Error).message}</B.Alert>

  // TODO we can show the comments before loading the replies
  if (repliesQuery.status === 'loading' || repliesQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (repliesQuery.status === 'error') return <B.Alert variant="danger">{(repliesQuery.error as Error).message}</B.Alert>

  const card = cardQuery.data
  const children = childrenQuery.data
  const comments = commentsQuery.data
  const replies = repliesQuery.data

  const isPrivate = cardSettings(card).visibility === 'private'

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
        {card.parentChain.map(id => <CardCrumbFetch key={id} cardId={id} />)}
        <CardCrumb card={card} active />
      </B.Breadcrumb>

      {card.canEdit && <>
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
      }

      <h1>
        {cardSettings(card).archived && <B.Badge bg="secondary" className="me-2">Archived</B.Badge>}
        {isPrivate && "🔒 "}
        {card.title}
      </h1>

      {card.tagline &&
        <div>
          <span className="text-muted">{card.tagline}</span>
        </div>
      }

      <div className="mb-5" style={{ marginTop: "calc(0.9rem + 0.3vw)", fontSize: "calc(0.9rem + 0.3vw)" }}>
        <CardActions
          card={card}
          onEdit={() => setEditing(true)}
          onMove={() => setMoving(true)}
          afterDelete={async () => {
            if (card.parentId) { await router.replace(cardRoute(card.parentId)) }
            else { await router.replace(boardsRoute()) }
          }}
        />
      </div>

      <Subcards parent={card} cards={children} />

      <Comments card={card} comments={comments} replies={replies} />
    </>
  )
}

CardPage.getInitialProps = getInitialProps
CardPage.preload = preload

export default CardPage