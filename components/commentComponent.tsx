import { Card, Comment, Reply, User } from '@prisma/client'
import { commentSettings } from '../lib/model-settings'
import React, { createRef, RefObject, useState } from 'react'
import Link from 'next/link'
import { RenderedMarkdown, markdownToHtml } from '../lib/markdown'
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil, BiCommentDetail } from 'react-icons/bi'
import * as B from 'react-bootstrap'
import styles from './commentComponent.module.scss'
import { Tiptap, TiptapMethods } from './tiptap'
import { CommentMenu } from './commentMenu'
import _ from 'lodash'
import { ReplyComponent, Reply_ } from './replyComponent'
import { LinkButton } from './linkButton'
import { CreateReplyModal } from './createReplyModal'
import { commentRoute } from 'lib/routes'
import { Formik } from 'formik'
import { useUpdateComment } from 'lib/queries/comments'

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
  afterDelete?: () => void
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
function EditCommentBody(props: {
  card: Card
  comment: Comment_
  stopEditing: () => void
}) {
  const { comment } = props
  const editorRef: RefObject<TiptapMethods> = React.useRef(null)
  const updateCommentMutation = useUpdateComment()
  return (
    <>
      <div className="d-flex justify-content-between" style={{ marginBottom: ".3em" }}>
        <InfoHeader {...props} />
      </div>
      <Formik
        initialValues={{}}
        onSubmit={async () => {
          if (!editorRef.current) throw Error("Editor is not initialized")
          await updateCommentMutation.mutateAsync({
            commentId: comment.id,
            content: editorRef.current.getMarkdown()
          })
          props.stopEditing()
        }}
      >
        {formik => (
          <B.Form onSubmit={formik.handleSubmit} >
            <div className="mb-2">
              <Tiptap
                content={markdownToHtml(props.comment.content)}
                autoFocus
                onSubmit={formik.handleSubmit}
                ref={editorRef} />
            </div>
            <B.Button size="sm" variant="primary" type="submit" disabled={formik.isSubmitting}>
              Save
              {formik.isSubmitting &&
                <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
            </B.Button>
            <B.Button size="sm" variant="secondary" type="button" className="ms-2"
              onClick={props.stopEditing}>
              Cancel
            </B.Button>
          </B.Form>
        )}
      </Formik>
    </>
  )
}

function Replies(props: {
  card
  replies
  afterDelete?: (id: Reply['id']) => void
}) {
  const replies =
    _.orderBy(props.replies, ['createdAt'], ['asc'])
  return (
    <div className="woc-comment-replies">
      {replies.map(reply => (
        <ReplyComponent key={reply.id} card={props.card} reply={reply}
          afterDelete={() => { if (props.afterDelete) props.afterDelete(reply.id) }}
        />
      ))}
    </div>
  )
}

export function CommentComponent(props: {
  card: Card
  comment: Comment_
  replies: Reply_[]
}) {
  const { comment } = props

  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'
  const classes = `
    woc-comment
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
        afterCreate={() => { setReplyModalShown(false) }}
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


