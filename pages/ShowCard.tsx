import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment } from '@prisma/client'
import { prisma } from '../lib/db'
import { cardSettings, commentSettings } from '../lib/model-settings'
import { Badge, Breadcrumb, Button, Form } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb, CardCrumb } from '../components/breadcrumbs'
import React, { createRef, RefObject, useState } from 'react'
import { Tiptap, TiptapMethods } from '../components/tiptap'
import _ from 'lodash'
import * as R from 'ramda'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { canEditCard } from 'lib/access'
import { getSession } from 'next-auth/react'
import { callCreateComment } from './api/comments/create'
import update from 'immutability-helper'
import { Formik } from 'formik'
import { CommentComponent } from 'components/commentComponent'
import { EditCardModal } from 'components/editCardModal'
import { CardMenu } from 'components/cardMenu'
import { BiPencil } from 'react-icons/bi'
import { useRouter } from 'next/router'

type Card_ = Card & {
  owner: User
  board: Board
  // We assume that we can edit comments iff we can edit the card
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

// TODO don't allow posting with empty content
class AddCommentForm extends React.Component<{
  cardId: Card['id']
  afterCommentCreated: (comment: Comment) => void
}> {
  // NB: We use a class because refs are set to null on rerenders when using functional components
  #editorRef: RefObject<TiptapMethods> = createRef()

  render() {
    return (
      <Formik
        initialValues={{ private: false }}
        onSubmit={async (values) => {
          if (!this.#editorRef.current) throw Error("Editor is not initialized")
          const comment = await callCreateComment({
            cardId: this.props.cardId,
            content: this.#editorRef.current.getMarkdown(),
            ...values
          })
          this.props.afterCommentCreated(comment)
          this.#editorRef.current.clearContent()
        }}
      >
        {props => (
          <Form onSubmit={props.handleSubmit}>
            <div className="mb-3" style={{ maxWidth: "40rem", width: "100%" }}>
              <Tiptap
                content=""
                autoFocus
                onSubmit={props.handleSubmit}
                ref={this.#editorRef} />
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
      comments: xs => _.map(xs, x => (x.id === comment.id ? comment : x))
    }))
  const deleteComment = (id: Comment['id']) =>
    setCard(prevCard => update(prevCard, {
      comments: xs => R.filter(x => (x.id !== id), xs)
    }))

  const [editCardShown, setEditCardShown] = useState(false)

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
            <CommentComponent key={comment.id} card={card} comment={{ ...comment, canEdit: card.canEdit }}
              afterCommentUpdated={updateComment}
              afterCommentDeleted={() => deleteComment(comment.id)}
            />
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
            <CommentComponent key={comment.id} card={card} comment={{ ...comment, canEdit: card.canEdit }}
              afterCommentUpdated={updateComment}
              afterCommentDeleted={() => deleteComment(comment.id)}
            />
          ))}
      </div>
    </>

  const router = useRouter()

  const EditButton = () => (
    <span
      className="text-muted me-3 link-button d-inline-flex align-items-center"
      onClick={() => setEditCardShown(true)}>
      <BiPencil className="me-1" /><span>Edit</span>
    </span>
  )

  const MoreButton = () => (
    <CardMenu
      card={card}
      afterCardUpdated={card => setCard(prev => ({ ...prev, ...card }))}
      afterCardDeleted={() => router.replace(`/ShowBoard?boardId=${card.boardId}`)} />
  )

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

        {card.canEdit &&
          <EditCardModal
            card={card}
            show={editCardShown}
            onHide={() => setEditCardShown(false)}
            afterCardUpdated={card => {
              setCard(prev => ({ ...prev, ...card }))
              setEditCardShown(false)
            }}
          />
        }
        <span
          className="ms-5"
          style={{ fontSize: "50%" }}
        >
          {card.canEdit && <EditButton />}
          <MoreButton />
        </span>

      </h1>
      {settings.reverseOrder ? reverseOrderComments : normalOrderComments}
    </>
  )
}

export default ShowCard