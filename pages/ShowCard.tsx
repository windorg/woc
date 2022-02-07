import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment, Reply } from '@prisma/client'
import { cardSettings, commentSettings } from '../lib/model-settings'
import * as B from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb, CardCrumb } from '../components/breadcrumbs'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import * as R from 'ramda'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { getSession } from 'next-auth/react'
import { CommentComponent, Comment_ } from 'components/commentComponent'
import { EditCardModal } from 'components/editCardModal'
import { CardActions } from 'components/cardActions'
import { useRouter } from 'next/router'
import { deleteById, filterSync, mapAsync, mergeById, updateById } from 'lib/array'
import { LinkButton } from 'components/linkButton'
import { boardRoute } from 'lib/routes'
import { AddCommentForm } from '../components/addCommentForm'
import { GetCardData, serverGetCard } from './api/cards/get'
import { ListCommentsData, serverListComments } from './api/comments/list'
import { ListRepliesData, serverListReplies } from './api/replies/list'
import { PreloadContext, WithPreload } from 'lib/link-preload'
import { prefetchCard, useCard } from 'lib/queries/cards'
import { prefetchComments, useComments } from 'lib/queries/comments'
import { prefetchReplies, useReplies } from 'lib/queries/replies'

type Props = {
  cardId: Card['id']
  card?: GetCardData
  comments?: ListCommentsData
  replies?: ListRepliesData
}

async function preload(context: PreloadContext): Promise<void> {
  const cardId = context.query.cardId as string
  await Promise.all([
    prefetchCard(context.queryClient, { cardId }),
    prefetchComments(context.queryClient, { cards: [cardId] }),
    prefetchReplies(context.queryClient, { cards: [cardId] })
  ])
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const cardId = context.query.cardId as string
  const props: Props = { cardId }
  if (typeof window === 'undefined') {
    const session = await getSession(context)
    await serverGetCard(session, { cardId })
      .then(result => { if (result.success) props.card = result.data })
    await serverListComments(session, { cards: [cardId] })
      .then(result => { if (result.success) props.comments = result.data })
    await serverListReplies(session, { cards: [cardId] })
      .then(result => { if (result.success) props.replies = result.data })
  }
  return serialize(props)
}

const ShowCard: WithPreload<NextPage<SuperJSONResult>> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { cardId } = initialProps

  const router = useRouter()
  const [editing, setEditing] = useState(false)

  const cardQuery = useCard({ cardId }, { initialData: initialProps.card })
  const commentsQuery = useComments({ cards: [cardId] }, { initialData: initialProps.comments })
  const repliesQuery = useReplies({ cards: [cardId] }, { initialData: initialProps.replies })

  // TODO all of this is boilerplate
  if (cardQuery.status === 'loading' || cardQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (cardQuery.status === 'error') return <B.Alert variant="danger">{(cardQuery.error as Error).message}</B.Alert>

  if (commentsQuery.status === 'loading' || commentsQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (commentsQuery.status === 'error') return <B.Alert variant="danger">{(commentsQuery.error as Error).message}</B.Alert>

  // TODO we can show the comments before loading the replies
  if (repliesQuery.status === 'loading' || repliesQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (repliesQuery.status === 'error') return <B.Alert variant="danger">{(repliesQuery.error as Error).message}</B.Alert>

  const card = cardQuery.data
  const comments = commentsQuery.data
  const replies = repliesQuery.data

  const renderCommentList = (comments) => comments.map(comment => (
    <CommentComponent key={comment.id}
      card={card}
      comment={{ ...comment, canEdit: card.canEdit }}
      replies={filterSync(replies, reply => reply.commentId === comment.id)}
    />
  ))

  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'

  const [pinnedComments, otherComments] =
    _.partition(
      _.orderBy(comments, ['createdAt'], ['desc']),
      comment => commentSettings(comment).pinned)

  const reverseOrderComments = () => (<>
    <p className="text-muted small">Comment order: oldest to newest.</p>
    <div className="mb-3">
      {renderCommentList(_.concat(R.reverse(pinnedComments), R.reverse(otherComments)))}
    </div>
    {card.canEdit && <AddCommentForm cardId={card.id} />}
  </>)
  // Note: we only use autoFocus for 'normalOrderComments' because for 'reverseOrderComments' it's annoying that the focus always jumps to the end of
  // the page after loading.
  const normalOrderComments = () => (<>
    {card.canEdit && <AddCommentForm cardId={card.id} autoFocus />}
    <div className="mt-4">
      {renderCommentList(_.concat(pinnedComments, otherComments))}
    </div>
  </>)

  return (
    <>
      <Head>
        {/* TODO OG/Twitter tags */}
        <title>{card.title} / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={card.owner} />
        <BoardCrumb board={card.board} />
        <CardCrumb card={card} active />
      </B.Breadcrumb>

      {card.canEdit &&
        <EditCardModal
          card={card}
          show={editing}
          onHide={() => setEditing(false)}
          afterSave={() => setEditing(false)}
        />
      }

      <h1>
        {cardSettings(card).archived && <B.Badge bg="secondary" className="me-2">Archived</B.Badge>}
        {isPrivate && "🔒 "}
        {card.title}
      </h1>

      <div className="mb-5" style={{ marginTop: "calc(0.9rem + 0.3vw)", fontSize: "calc(0.9rem + 0.3vw)" }}>
        <CardActions
          card={card}
          onEdit={() => setEditing(true)}
          afterDelete={async () => router.replace(boardRoute(card.boardId))}
        />
      </div>

      {settings.reverseOrder ? reverseOrderComments() : normalOrderComments()}
    </>
  )
}

ShowCard.getInitialProps = getInitialProps
ShowCard.preload = preload

export default ShowCard