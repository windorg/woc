import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment } from '@prisma/client'
import { prisma } from '../lib/db'
import { cardSettings, commentSettings } from '../lib/model-settings'
import { Badge, Breadcrumb, Button, Dropdown, Form } from 'react-bootstrap'
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
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil, BiDotsHorizontal, BiPin, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import { AiOutlinePushpin } from 'react-icons/ai'
import { Formik } from 'formik'
import copy from 'copy-to-clipboard'
import { callUpdateComment } from './api/comments/update'

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
  // TODO filter out private comments
  const props: Props = {
    initialCard: {
      ...card, canEdit: await canEditCard(session?.userId, card)
    }
  }
  return {
    props: serialize(props)
  }
}

function CommentComponent(props: {
  card: Card
  comment: Comment
  afterCommentUpdated: (comment: Comment) => void
}) {
  const { card, comment } = props
  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'
  const cardClasses =
    "woc-comment" +
    (isPrivate ? " woc-comment-private" : "") +
    (settings.pinned ? " woc-comment-pinned" : "")

  const updateComment = async data => {
    const diff = await callUpdateComment({ commentId: comment.id, ...data })
    props.afterCommentUpdated({ ...comment, ...diff })
  }

  return (
    <div key={comment.id} id={`comment-${comment.id}`} className={cardClasses}>
      <div className="d-flex justify-content-between" style={{ marginBottom: ".3em" }}>
        <span className="text-muted small d-flex">
          <Link href={`/ShowCard?cardId=${card.id}#comment-${comment.id}`}>
            <a className="d-flex align-items-center">
              <BiLink className="me-1" />
              <ReactTimeAgo timeStyle="twitter-minute-now" date={comment.createdAt} />
            </a>
          </Link>
          {isPrivate && <span className="ms-2"> 🔒</span>}
        </span>
        <div className="d-inline-flex small text-muted" style={{ marginTop: "3px" }}>
          <span className="link-button link-button-dashed d-flex align-items-center">
            <BiPencil className="me-1" /><span>Edit</span>
          </span>
          <Dropdown className="link-button ms-3 d-flex align-items-center woc-comment-more">
            <Dropdown.Toggle as="span" className="d-flex align-items-center">
              <BiDotsHorizontal className="me-1" /><span>More</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item className="d-flex align-items-center"
                onClick={() => { copy(`https://windofchange.me/ShowCard?cardId=${card.id}#comment-${comment.id}`) }}>
                <BiShareAlt className="icon" /><span>Copy link</span>
              </Dropdown.Item>
              {isPrivate
                ?
                <Dropdown.Item className="d-flex align-items-center" onClick={() => updateComment({ private: false })}>
                  <BiLockOpen className="icon" /><span>Make public</span>
                </Dropdown.Item>
                :
                <Dropdown.Item className="d-flex align-items-center" onClick={() => updateComment({ private: true })}>
                  <BiLock className="icon" /><span>Make private</span>
                </Dropdown.Item>
              }
              {settings.pinned
                ?
                <Dropdown.Item className="d-flex align-items-center" onClick={() => updateComment({ pinned: false })}>
                  <AiOutlinePushpin className="icon" /><span>Unpin</span>
                </Dropdown.Item>
                :
                <Dropdown.Item className="d-flex align-items-center" onClick={() => updateComment({ pinned: true })}>
                  <AiOutlinePushpin className="icon" /><span>Pin</span>
                </Dropdown.Item>
              }
              <Dropdown.Divider />
              <Dropdown.Item className="d-flex align-items-center text-danger">
                <BiTrashAlt className="icon" /><span>Delete</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* TODO implement editing and deletion */}
        </div>
      </div>
      <div className="rendered-content">
        {renderMarkdown(comment.content)}
      </div>
      {/* TODO render replies */}
    </div >
  )
}

// TODO don't allow posting with empty content
class AddCommentForm extends React.Component<{
  cardId: Card['id']
  afterCommentCreated: (comment: Comment) => void
}> {
  // NB: We use a class because refs are set to null on rerenders when using functional components
  private editorRef: RefObject<TiptapMethods>
  constructor(props) {
    super(props)
    this.editorRef = createRef()
  }
  render() {
    return (
      <Formik
        initialValues={{ private: false }}
        onSubmit={async (values) => {
          if (!this.editorRef.current) throw Error("Editor is not initialized")
          const comment = await callCreateComment({
            cardId: this.props.cardId,
            content: this.editorRef.current.getMarkdown(),
            ...values
          })
          this.props.afterCommentCreated(comment)
          this.editorRef.current.clearContent()
        }}
      >
        {props => (
          <Form onSubmit={props.handleSubmit}>
            <div className="mb-3" style={{ maxWidth: "40rem", width: "100%" }}>
              <Tiptap content="" onSubmit={props.handleSubmit} ref={this.editorRef} />
            </div>
            <Button variant="primary" type="submit">Post</Button>
            <Form.Check
              name="private" id="private" checked={props.values.private} onChange={props.handleChange}
              type="checkbox" className="ms-4" inline label="🔒 Private comment" />
          </Form>
        )}
      </Formik>
    )
  }
}

const ShowCard: NextPage<SuperJSONResult> = (props) => {
  const { initialCard } = deserialize<Props>(props)

  const [card, setCard] = useState(initialCard)
  const addComment = (comment: Comment) =>
    setCard(prevCard => update(prevCard, { comments: { $push: [comment] } }))
  const updateComment = (comment: Comment) =>
    setCard(prevCard => update(prevCard, {
      comments: { $apply: xs => _.map(xs, x => (x.id === comment.id ? comment : x)) }
    }))

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
          .map(comment => (
            <CommentComponent key={comment.id} card={card} comment={comment}
              afterCommentUpdated={updateComment} />
          ))}
      </div>
      {card.canEdit && <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />}
    </>
  const normalOrderComments =
    <>
      {card.canEdit && <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />}
      <div className="mt-4">
        {_.concat(pinnedComments, otherComments)
          .map(comment => (
            <CommentComponent key={comment.id} card={card} comment={comment}
              afterCommentUpdated={updateComment} />
          ))}
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