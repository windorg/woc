import { Card, Comment, Reply, User } from '@prisma/client'
import { commentSettings } from '../lib/model-settings'
import React, { createRef, RefObject, useState } from 'react'
import Link from 'next/link'
import { RenderedMarkdown, markdownToHtml } from '../lib/markdown'
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil, BiCommentDetail } from 'react-icons/bi'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { callUpdateComment } from '../pages/api/comments/update'
import styles from './commentComponent.module.scss'
import { Tiptap, TiptapMethods } from './tiptap'
import { CommentMenu } from './commentMenu'
import _ from 'lodash'
import { ReplyComponent, Reply_ } from './replyComponent'
import { LinkButton } from './linkButton'
import { CreateReplyModal } from './createReplyModal'
import { commentRoute } from 'lib/routes'

export type Comment_ = Comment & {
  canEdit: boolean
}

// Timestamp & the little lock
function InfoHeader(props: { card: Card, comment: Comment_ }) {
  const settings = commentSettings(props.comment)
  const isPrivate = settings.visibility === 'private'
  return (
    <span className="small d-flex">
      <Link href={commentRoute({ cardId: props.card.id, commentId: props.comment.id })}>
        <a className="d-flex align-items-center">
          <BiLink className="me-1" />
          <ReactTimeAgo timeStyle="twitter-minute-now" date={props.comment.createdAt} />
        </a>
      </Link>
      {isPrivate && <span className="ms-2">🔒</span>}
    </span>
  )
}

// Comment in "normal" mode
function ShowCommentBody(props: {
  card: Card
  comment: Comment_
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
  startEditing: () => void
  openReplyModal: () => void
}) {
  const { comment } = props

  // TODO it should be possible to quit editing the comment by pressing escape

  return (
    <>
      <div className="d-flex justify-content-between" style={{ marginBottom: ".3em" }}>
        <InfoHeader {...props} />
        <div className="d-inline-flex small text-muted" style={{ marginTop: "3px" }}>
          <LinkButton onClick={props.openReplyModal} icon={<BiCommentDetail />}>Reply</LinkButton>
          <span className="me-3" />
          {comment.canEdit && <>
            <LinkButton onClick={props.startEditing} icon={<BiPencil />}>Edit</LinkButton>
            <span className="me-3" />
          </>}
          <CommentMenu {...props} />
        </div>
      </div>
      <RenderedMarkdown className="rendered-content" markdown={comment.content} />
    </>
  )
}

// Comment in "edit" mode
class EditCommentBody extends React.Component<{
  card: Card
  comment: Comment_
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
  stopEditing: () => void
}> {
  #editorRef: RefObject<TiptapMethods> = createRef()

  render() {
    const { comment } = this.props

    const handleSubmit = async (e?: any) => {
      if (e) e.preventDefault()
      if (!this.#editorRef.current) throw Error("Editor is not initialized")
      const diff = await callUpdateComment({
        commentId: comment.id,
        content: this.#editorRef.current.getMarkdown()
      })
      const newComment = { ...comment, ...diff }
      this.props.stopEditing()
      this.props.afterCommentUpdated(newComment)
    }

    return (
      <>
        <div className="d-flex justify-content-between" style={{ marginBottom: ".3em" }}>
          <InfoHeader {...this.props} />
        </div>
        <Form onSubmit={handleSubmit} >
          <div className="mb-2">
            <Tiptap
              content={markdownToHtml(this.props.comment.content)}
              autoFocus
              onSubmit={handleSubmit}
              ref={this.#editorRef} />
          </div>
          <Button size="sm" variant="primary" type="submit">Save</Button>
          <Button size="sm" variant="secondary" type="button" className="ms-2"
            onClick={this.props.stopEditing}>
            Cancel
          </Button>
        </Form>
      </>
    )
  }
}

function Replies(props: {
  card
  replies
  afterReplyUpdated: (newReply: Reply) => void
  afterReplyDeleted: (id: Reply['id']) => void
}) {
  const replies =
    _.orderBy(props.replies, ['createdAt'], ['asc'])
  return (
    <div className="woc-comment-replies ms-5">
      {replies.map(reply => (
        <ReplyComponent key={reply.id} card={props.card} reply={reply}
          afterReplyUpdated={props.afterReplyUpdated}
          afterReplyDeleted={() => props.afterReplyDeleted(reply.id)}
        />
      ))}
    </div>
  )
}

export function CommentComponent(props: {
  card: Card
  comment: Comment_
  replies: Reply_[]
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
  afterReplyCreated: (newReply: Reply_) => void
  afterReplyUpdated: (newReply: Reply) => void
  afterReplyDeleted: (id: Reply['id']) => void
}) {
  const { comment } = props

  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'
  const classes = `
    ${styles.comment}
    ${isPrivate ? styles.commentPrivate : ""}
    ${settings.pinned ? styles.commentPinned : ""}
    `

  // Is the comment itself (not the replies) in the editing mode now?
  const [editing, setEditing] = useState(false)

  // Is the reply modal open?
  const [replyModalShown, setReplyModalShown] = useState(false)

  return (
    <div id={`comment-${comment.id}`} className={classes}>
      <CreateReplyModal
        show={replyModalShown}
        comment={props.comment}
        onHide={() => setReplyModalShown(false)}
        afterReplyCreated={(newReply) => {
          setReplyModalShown(false)
          props.afterReplyCreated(newReply)
        }}
      />
      {editing
        ?
        <EditCommentBody {...props} stopEditing={() => setEditing(false)} />
        :
        <ShowCommentBody
          {...props}
          startEditing={() => setEditing(true)}
          openReplyModal={() => setReplyModalShown(true)}
        />
      }
      <Replies {...props} />
    </div>
  )
}


