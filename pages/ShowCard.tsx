import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment } from '@prisma/client'
import { prisma } from '../lib/db'
import { cardSettings, commentSettings } from '../lib/model-settings'
import { Badge, Breadcrumb, Button, Form } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb, CardCrumb } from '../components/breadcrumbs'
import React, { createRef, Ref, RefObject } from 'react'
import Link from 'next/link'
import { Tiptap, TiptapMethods } from '../components/tiptap'
import _ from 'lodash'
import * as R from 'ramda'
import { renderMarkdown } from '../lib/markdown'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { canEditCard } from 'lib/access'
import { getSession } from 'next-auth/react'
import { callCreateComment } from './api/comments/create'
import { useRouter } from 'next/router'

type Card_ = Card & {
  owner: User
  board: Board
  comments: Comment[]
  canEdit: boolean
}

type Props = {
  card: Card_
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  let card = await prisma.card.findUnique({
    where: {
      id: context.query.cardId as string
    },
    include: {
      owner: true,
      board: true,
      comments: true
    }
  })
  if (!card) { return { notFound: true } }
  const props: Props = { card: { ...card, canEdit: await canEditCard(session?.userId, card) } }
  return {
    props: serialize(props)
  }
}

function Comment(props: { card: Card, comment: Comment }) {
  const { card, comment } = props
  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'
  const cardClasses =
    "woc-card-update" +
    (isPrivate ? " woc-card-update-private" : "") +
    (settings.pinned ? " woc-card-update-pinned" : "")
  return (
    <div key={comment.id} id={`comment-${comment.id}`} className={cardClasses}>
      <div style={{ marginBottom: ".3em" }}>
        <span className="text-muted small">
          <Link href={`/ShowCard?cardId=${card.id}#comment-${comment.id}`}>
            <a>{comment.createdAt.toString()} {/* TODO <a>{renderTimestamp(comment.createdAt)}</a> */}</a>
          </Link>
        </span>
        {isPrivate && "🔒 "}
        <div className="ms-3 d-inline-flex">
          {/* TODO render comment buttons */}
        </div>
      </div>
      <div className="rendered-content">
        {renderMarkdown(comment.content)}
      </div>
      {/* TODO render replies */}
    </div>
  )
}

// TODO handle the "private" checkbox
function AddCommentForm(props: { cardId: Card['id'] }) {
  const editorRef: RefObject<TiptapMethods> = createRef()
  const router = useRouter()
  const onSubmit = () => {
    if (!editorRef.current) throw Error("Editor is not initialized")
    callCreateComment({
      cardId: props.cardId,
      content: editorRef.current.getMarkdown()
    })
    // TODO add comments without reloading the page
    // editorRef.current.clearContent()
    router.reload()
  }
  return (
    <Form onSubmit={e => { e.preventDefault(); onSubmit() }}>
      <div className="mb-3" style={{ maxWidth: "40rem", width: "100%" }}>
        <Tiptap content="" onSubmit={onSubmit} ref={editorRef} />
      </div>
      <Button variant="primary" type="submit">Post</Button>
      <Form.Check className="ms-4" inline id="commentPrivate" type="checkbox" label="🔒 Private comment" />
    </Form>
  )
}

const ShowCard: NextPage<SuperJSONResult> = (props) => {
  const { card } = deserialize<Props>(props)

  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'
  const [pinnedUpdates, otherUpdates] =
    _.partition(
      _.orderBy(card.comments, ['createdAt'], ['desc']),
      comment => commentSettings(comment).pinned)
  const reverseOrderUpdates =
    <>
      <p className="text-muted small">Comment order: oldest to newest.</p>
      <div className="mb-3">
        {_.concat(R.reverse(pinnedUpdates), R.reverse(otherUpdates))
          .map(comment => (<Comment key={comment.id} card={card} comment={comment} />))}
      </div>
      {card.canEdit && <AddCommentForm cardId={card.id} />}
    </>
  const normalOrderUpdates =
    <>
      {card.canEdit && <AddCommentForm cardId={card.id} />}
      <div className="mt-4">
        {_.concat(pinnedUpdates, otherUpdates)
          .map(comment => (<Comment key={comment.id} card={card} comment={comment} />))}
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
        {/* TODO card edit & delete buttons */}
      </h1>
      {settings.reverseOrder ? reverseOrderUpdates : normalOrderUpdates}
    </>
  )
}

export default ShowCard