import type * as GQL from 'generated/graphql/graphql'
import React, { RefObject, useState } from 'react'
import Link from 'next/link'
import { RenderedMarkdown, markdownToHtml } from '../lib/markdown'
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil } from 'react-icons/bi'
import * as B from 'react-bootstrap'
import { Tiptap, TiptapMethods } from './tiptap'
import { Gravatar } from './gravatar'
import { LinkButton } from './linkButton'
import { ReplyMenu } from './replyMenu'
import { replyRoute, userRoute } from 'lib/routes'
import { Formik } from 'formik'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'

export type Reply_ = Pick<
  GQL.Reply,
  'id' | 'content' | 'createdAt' | 'canEdit' | 'canDelete' | 'visibility'
> & {
  // The author can be 'undefined' if it was deleted.
  // We don't delete replies if the author's account is gone.
  author: Pick<GQL.User, 'id' | 'displayName' | 'userpicUrl'> | undefined
}

function AuthorPic(props: { author: Pick<GQL.User, 'id' | 'userpicUrl'> | undefined }) {
  return props.author ? (
    <Link href={userRoute(props.author.id)}>
      <Gravatar url={props.author.userpicUrl} size="tiny" />
    </Link>
  ) : (
    <Gravatar size="tiny" />
  )
}

// Timestamp & the little lock
function InfoHeader(props: { card: Pick<GQL.Card, 'id'>; reply: Reply_ }) {
  const { reply } = props
  const isPrivate = reply.visibility === 'private'
  // TODO when we implement private replies, check that the lock can be shown
  return (
    <span className="small d-inline-flex">
      <strong>
        {reply.author ? (
          <Link href={userRoute(reply.author.id)}>{reply.author.displayName}</Link>
        ) : (
          '[deleted]'
        )}
      </strong>
      <span className="ms-2" />
      <Link
        href={replyRoute({ cardId: props.card.id, replyId: reply.id })}
        className="d-flex align-items-center"
      >
        <BiLink className="me-1" />
        <ReactTimeAgo timeStyle="twitter-minute-now" date={reply.createdAt} />
      </Link>
      {isPrivate && <span className="ms-2">🔒</span>}
    </span>
  )
}

// Component in "normal" mode
function ShowReply(props: {
  card: Pick<GQL.Card, 'id'>
  reply: Reply_
  afterDelete?: () => void
  startEditing: () => void
}) {
  const { card, reply } = props
  const isPrivate = reply.visibility === 'private'
  const classes = `
    woc-reply
    d-flex
    reply
    ${isPrivate ? 'reply-private' : ''}
    `

  // TODO "mark as read"

  return (
    <div id={`reply-${reply.id}`} className={classes}>
      <div className="flex-shrink-0">
        <AuthorPic author={reply.author} />
      </div>
      {/* All the align-items-* is necessary for the edit button to align with the info header */}
      <div className="flex-grow-1 ms-1" style={{ marginTop: '3px' }}>
        <div
          className="d-flex align-items-center"
          style={{ lineHeight: '100%', marginBottom: '.3em' }}
        >
          <InfoHeader {...props} />
          <div className="d-inline-flex small text-muted ms-4 align-items-end">
            {props.reply.canEdit && (
              <>
                <LinkButton onClick={props.startEditing} icon={<BiPencil />}>
                  Edit
                </LinkButton>
                <span className="me-3" />
              </>
            )}
            <ReplyMenu {...props} />
          </div>
        </div>
        <RenderedMarkdown
          className="woc-reply-content rendered-content small"
          markdown={reply.content}
        />
      </div>
    </div>
  )
}

const useUpdateReplyContent = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation updateReplyContent($id: UUID!, $content: String!) {
        updateReply(input: { id: $id, content: $content }) {
          reply {
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

// Component in "edit" mode
function EditReply(props: { card: Pick<GQL.Card, 'id'>; reply: Reply_; stopEditing: () => void }) {
  const editorRef: RefObject<TiptapMethods> = React.useRef(null)
  const updateReplyMutation = useUpdateReplyContent()

  const { card, reply } = props
  const isPrivate = reply.visibility === 'private'
  const classes = `
      woc-reply
      d-flex
      reply
      ${isPrivate ? 'reply-private' : ''}
      `

  return (
    <div id={`reply-${reply.id}`} className={classes}>
      <div className="flex-shrink-0">
        <AuthorPic author={reply.author} />
      </div>
      <div className="flex-grow-1 ms-1" style={{ marginTop: '3px' }}>
        <div
          className="d-flex align-items-center"
          style={{ lineHeight: '100%', marginBottom: '.3em' }}
        >
          <InfoHeader {...props} />
        </div>
        <Formik
          initialValues={{}}
          onSubmit={async () => {
            if (!editorRef.current) throw Error('Editor is not initialized')
            await updateReplyMutation.do({
              variables: {
                id: reply.id,
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
                  className="small"
                  content={markdownToHtml(props.reply.content)}
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
      </div>
    </div>
  )
}

export function ReplyComponent(props: {
  card: Pick<GQL.Card, 'id'>
  reply: Reply_
  afterDelete?: () => void
}) {
  const [editing, setEditing] = useState(false)
  return editing ? (
    <EditReply {...props} stopEditing={() => setEditing(false)} />
  ) : (
    <ShowReply {...props} startEditing={() => setEditing(true)} />
  )
}
