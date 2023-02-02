import type * as GQL from 'generated/graphql/graphql'
import { Reply, User } from '@prisma/client'
import React, { RefObject, useState } from 'react'
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
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { Visibility } from '@lib/graphql/schema/visibility'

const useUpdateCommentContent = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation updateCommentContent($id: UUID!, $content: String!) {
        updateComment(input: { id: $id, content: $content }) {
          comment {
            id
            content
          }
        }
      }
    `)
    // We don't have to evict anything from the cache because Apollo will automatically update the cache with newly fetched data.
  )
  return { do: action, result }
}

// Timestamp & the little lock
function InfoHeader(props: {
  card: Pick<GQL.Card, 'id'>
  comment: Pick<GQL.Comment, 'id' | 'visibility' | 'createdAt'>
}) {
  const isPrivate = props.comment.visibility === Visibility.Private
  return (
    <span className="small d-flex">
      <Link
        href={commentRoute({ cardId: props.card.id, commentId: props.comment.id })}
        className="d-flex align-items-center"
      >
        <BiLink className="me-1" />
        <ReactTimeAgo timeStyle="twitter-minute-now" date={props.comment.createdAt} />
      </Link>
      {isPrivate && <span className="ms-2">🔒</span>}
    </span>
  )
}

// Comment in "normal" mode
function ShowCommentBody(props: {
  card: Pick<GQL.Card, 'id'>
  comment: Pick<GQL.Comment, 'id' | 'content' | 'visibility' | 'pinned' | 'createdAt' | 'canEdit'>
  afterDelete?: () => void
  startEditing: () => void
  openReplyModal: () => void
}) {
  const { comment } = props

  // TODO it should be possible to quit editing the comment by pressing escape

  return (
    <>
      <div className="d-flex justify-content-between" style={{ marginBottom: '.3em' }}>
        <InfoHeader {...props} />
        <div className="d-inline-flex small text-muted" style={{ marginTop: '3px' }}>
          <LinkButton onClick={props.openReplyModal} icon={<BiCommentDetail />}>
            Reply
          </LinkButton>
          <span className="me-3" />
          {comment.canEdit && (
            <>
              <LinkButton onClick={props.startEditing} icon={<BiPencil />}>
                Edit
              </LinkButton>
              <span className="me-3" />
            </>
          )}
          <CommentMenu {...props} />
        </div>
      </div>
      <RenderedMarkdown className="rendered-content" markdown={comment.content} />
    </>
  )
}

// Comment in "edit" mode
function EditCommentBody(props: {
  card: Pick<GQL.Card, 'id'>
  comment: Pick<GQL.Comment, 'id' | 'content' | 'visibility' | 'createdAt' | 'canEdit'>
  stopEditing: () => void
}) {
  const { comment } = props
  const editorRef: RefObject<TiptapMethods> = React.useRef(null)
  const updateCommentContentMutation = useUpdateCommentContent()
  return (
    <>
      <div className="d-flex justify-content-between" style={{ marginBottom: '.3em' }}>
        <InfoHeader {...props} />
      </div>
      <Formik
        initialValues={{}}
        onSubmit={async () => {
          if (!editorRef.current) throw Error('Editor is not initialized')
          await updateCommentContentMutation.do({
            variables: {
              id: comment.id,
              content: editorRef.current.getMarkdown(),
            },
          })
          props.stopEditing()
        }}
      >
        {(formik) => (
          <B.Form onSubmit={formik.handleSubmit}>
            <div className="mb-2">
              <Tiptap
                content={markdownToHtml(props.comment.content)}
                autoFocus
                onSubmit={formik.handleSubmit}
                ref={editorRef}
              />
            </div>
            <B.Button size="sm" variant="primary" type="submit" disabled={formik.isSubmitting}>
              Save
              {formik.isSubmitting && (
                <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
              )}
            </B.Button>
            <B.Button
              size="sm"
              variant="secondary"
              type="button"
              className="ms-2"
              onClick={props.stopEditing}
            >
              Cancel
            </B.Button>
          </B.Form>
        )}
      </Formik>
    </>
  )
}

function Replies(props: {
  card: Pick<GQL.Card, 'id'>
  replies
  afterDelete?: (id: Reply['id']) => void
}) {
  const replies = _.orderBy(props.replies, ['createdAt'], ['asc'])
  return (
    <div className="woc-comment-replies">
      {replies.map((reply) => (
        <ReplyComponent
          key={reply.id}
          card={props.card}
          reply={reply}
          afterDelete={() => {
            if (props.afterDelete) props.afterDelete(reply.id)
          }}
        />
      ))}
    </div>
  )
}

export function CommentComponent(props: {
  card: Pick<GQL.Card, 'id'>
  comment: Pick<GQL.Comment, 'id' | 'visibility' | 'pinned' | 'content' | 'createdAt' | 'canEdit'>
  replies: Reply_[]
}) {
  const { comment } = props

  const isPrivate = comment.visibility === Visibility.Private
  const classes = `
    woc-comment
    ${styles.comment}
    ${isPrivate ? styles.commentPrivate : ''}
    ${comment.pinned ? styles.commentPinned : ''}
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
        afterCreate={() => {
          setReplyModalShown(false)
        }}
      />
      {editing ? (
        <EditCommentBody {...props} stopEditing={() => setEditing(false)} />
      ) : (
        <ShowCommentBody
          {...props}
          startEditing={() => setEditing(true)}
          openReplyModal={() => setReplyModalShown(true)}
        />
      )}
      <Replies {...props} />
    </div>
  )
}
