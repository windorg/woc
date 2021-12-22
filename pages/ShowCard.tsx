import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment, Reply } from '@prisma/client'
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
import { canDeleteReply, canEditCard, canEditReply } from 'lib/access'
import { getSession } from 'next-auth/react'
import { callCreateComment } from './api/comments/create'
import { Formik } from 'formik'
import { CommentComponent, Comment_ } from 'components/commentComponent'
import { EditCardModal } from 'components/editCardModal'
import { CardMenu } from 'components/cardMenu'
import { BiPencil } from 'react-icons/bi'
import { useRouter } from 'next/router'
import { Reply_ } from 'components/replyComponent'
import { deleteById, mergeById, updateById } from 'lib/array'
import { LinkButton } from 'components/linkButton'

type Card_ = Card & {
  owner: User
  board: Board
  comments: (Comment_ & { replies: Reply_[] })[]
  canEdit: boolean
}

type Props = {
  initialCard: Card_
}

const cardFindSettings = {
  include: {
    owner: true,
    board: true,
    comments: {
      include: {
        replies: {
          include: {
            author: { select: { id: true, email: true, displayName: true } }
          }
        }
      }
    }
  }
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  const card = await prisma.card.findUnique({
    where: {
      id: context.query.cardId as string
    },
    ...cardFindSettings
  })
  if (!card) { return { notFound: true } }
  const canEditCard_ = await canEditCard(session?.userId, card)

  const augmentedCard: Card_ = {
    ...card,
    canEdit: canEditCard_,
    comments: await Promise.all(card.comments.map(async comment => ({
      ...comment,
      // Augment comments with "canEdit". For speed we assume that if you can edit the card, you can edit the comments
      canEdit: canEditCard_,
      replies: await Promise.all(comment.replies.map(async reply => ({
        ...reply,
        // Augment replies with "canEdit" and "canDelete"
        canEdit: await canEditReply(session?.userId, { ...reply, comment: { ...comment, card } }),
        canDelete: await canDeleteReply(session?.userId, { ...reply, comment: { ...comment, card } })
      })))
    })))
  }

  // TODO filter out private comments & private replies
  const props: Props = {
    initialCard: augmentedCard
  }
  return {
    props: serialize(props)
  }
}

// TODO Currently autoFocus fires every time we e.g. edit a comment, and then the page is scrolled back to the top. This
// is annoying.

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
          <Form onSubmit={props.handleSubmit} className="woc-comment-form">
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

  // Card state & card-modifying methods
  const [card, setCard] = useState(initialCard)

  // Assuming that this is only called for own comments (and therefore they can be edited). Shouldn't be called for
  // e.g. comments coming from a websocket
  const addComment = (comment: Comment) => setCard(card => ({
    ...card,
    comments: card.comments.concat([{ ...comment, replies: [], canEdit: true }])
  }))

  const updateComment = (comment: Comment) => setCard(card => ({
    ...card,
    comments: mergeById(card.comments, comment)
  }))

  const deleteComment = (commentId) => setCard(card => ({
    ...card,
    comments: deleteById(card.comments, commentId)
  }))

  const addReply = (commentId, reply: Reply_) => setCard(card => ({
    ...card,
    comments: updateById(card.comments, commentId, (comment => ({
      ...comment,
      replies: comment.replies.concat([reply])
    })))
  }))

  const updateReply = (commentId, reply: Reply) => setCard(card => ({
    ...card,
    comments: updateById(card.comments, commentId, (comment => ({
      ...comment,
      replies: mergeById(comment.replies, reply)
    })))
  }))

  const deleteReply = (commentId, replyId) => setCard(card => ({
    ...card,
    comments: updateById(card.comments, commentId, (comment => ({
      ...comment,
      replies: deleteById(comment.replies, replyId)
    })))
  }))

  const [editCardShown, setEditCardShown] = useState(false)

  const renderCommentList = (comments) => comments.map(comment => (
    <CommentComponent key={comment.id}
      card={card}
      comment={{ ...comment, canEdit: card.canEdit }}
      replies={comment.replies}
      afterCommentUpdated={updateComment}
      afterCommentDeleted={() => deleteComment(comment.id)}
      afterReplyCreated={reply => addReply(comment.id, reply)}
      afterReplyUpdated={reply => updateReply(comment.id, reply)}
      afterReplyDeleted={replyId => deleteReply(comment.id, replyId)}
    />
  ))

  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'

  const [pinnedComments, otherComments] =
    _.partition(
      _.orderBy(card.comments, ['createdAt'], ['desc']),
      comment => commentSettings(comment).pinned)

  const ReverseOrderComments = () => (<>
    <p className="text-muted small">Comment order: oldest to newest.</p>
    <div className="mb-3">
      {renderCommentList(_.concat(R.reverse(pinnedComments), R.reverse(otherComments)))}
    </div>
    {card.canEdit && <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />}
  </>)
  const NormalOrderComments = () => (<>
    {card.canEdit && <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />}
    <div className="mt-4">
      {renderCommentList(_.concat(pinnedComments, otherComments))}
    </div>
  </>)

  const router = useRouter()

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
          {card.canEdit && <>
            <LinkButton onClick={() => setEditCardShown(true)} icon={<BiPencil />}>Edit</LinkButton>
            <span className="me-3" />
          </>}
          <MoreButton />
        </span>
      </h1>
      {settings.reverseOrder ? <ReverseOrderComments /> : <NormalOrderComments />}
    </>
  )
}

export default ShowCard