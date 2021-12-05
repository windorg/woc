import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment } from '@prisma/client'
import { prisma } from '../lib/db'
import { cardSettings, commentSettings } from '../lib/model-settings'
import { Badge, Breadcrumb, Button, Form } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb, CardCrumb } from '../components/breadcrumbs'
import React, { createRef, RefObject, useState } from 'react'
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
import update from 'immutability-helper'

type Card_ = Card & {
  owner: User
  board: Board
  comments: Comment[]
  canEdit: boolean
}

type Props = {
  initialCard: Card_
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
  const props: Props = {
    initialCard: {
      ...card, canEdit: await canEditCard(session?.userId, card)
    }
  }
  return {
    props: serialize(props)
  }
}

function CommentComponent(props: { card: Card, comment: Comment }) {
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
class AddCommentForm extends React.Component<{
  cardId: Card['id']
  addComment: (comment: Comment) => void
}> {
  // We use a class because refs are set to null on rerenders when using functional components
  private editorRef: RefObject<TiptapMethods>
  constructor(props) {
    super(props)
    this.editorRef = createRef()
  }
  render() {
    const submit = async () => {
      if (!this.editorRef.current) throw Error("Editor is not initialized")
      const comment = await callCreateComment({
        cardId: this.props.cardId,
        content: this.editorRef.current.getMarkdown()
      })
      this.props.addComment(comment)
      this.editorRef.current.clearContent()
    }
    return (
      <Form onSubmit={e => { e.preventDefault(); submit() }}>
        <div className="mb-3" style={{ maxWidth: "40rem", width: "100%" }}>
          <Tiptap content="" onSubmit={submit} ref={this.editorRef} />
        </div>
        <Button variant="primary" type="submit">Post</Button>
        <Form.Check className="ms-4" inline id="commentPrivate" type="checkbox" label="🔒 Private comment" />
      </Form >
    )
  }
}

const ShowCard: NextPage<SuperJSONResult> = (props) => {
  const { initialCard } = deserialize<Props>(props)

  const [card, setCard] = useState(initialCard)
  const addComment = (comment: Comment) =>
    setCard(prevCard => update(prevCard, { comments: { $push: [comment] } }))

  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'
  const [pinnedComments, otherComments] =
    _.partition(
      _.orderBy(card.comments, ['createdAt'], ['desc']),
      comment => commentSettings(comment).pinned)
  const reverseOrderComments =
    <>
      <p className="text-muted small">Comment order: oldest to newest.</p>
      <div className="mb-3">
        {_.concat(R.reverse(pinnedComments), R.reverse(otherComments))
          .map(comment => (<CommentComponent key={comment.id} card={card} comment={comment} />))}
      </div>
      {card.canEdit && <AddCommentForm addComment={addComment} cardId={card.id} />}
    </>
  const normalOrderComments =
    <>
      {card.canEdit && <AddCommentForm addComment={addComment} cardId={card.id} />}
      <div className="mt-4">
        {_.concat(pinnedComments, otherComments)
          .map(comment => (<CommentComponent key={comment.id} card={card} comment={comment} />))}
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
      {settings.reverseOrder ? reverseOrderComments : normalOrderComments}
    </>
  )
}

export default ShowCard