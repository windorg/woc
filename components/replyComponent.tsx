import { Card, Reply, User } from '@prisma/client'
import { replySettings } from '../lib/model-settings'
import React, { createRef, RefObject, useState } from 'react'
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
import { useUpdateReply } from 'lib/queries/replies'

export type Reply_ = Reply & {
  // The author can be 'null' if it was deleted. We don't delete replies if the author's account is gone.
  author: Pick<User, 'id' | 'email' | 'displayName'> | null
  canEdit: boolean
  // Unlike other entities, canEdit ≠ canDelete for replies. Comment owners can always delete replies, even ones left by
  // other people.
  canDelete: boolean
}

function AuthorPic(props: { author: Pick<User, 'id' | 'email'> | null }) {
  return props.author ? (
    <Link href={userRoute(props.author.id)}>
      <a>
        <Gravatar email={props.author.email} size="tiny" />
      </a>
    </Link>
  ) : (
    <Gravatar email="" size="tiny" />
  )
}

// Timestamp & the little lock
function InfoHeader(props: { card: Card; reply: Reply_ }) {
  const { reply } = props
  const settings = replySettings(reply)
  const isPrivate = settings.visibility === 'private'
  // TODO when we implement private replies, check that the lock can be shown
  return (
    <span className="small d-inline-flex">
      <strong>
        {reply.author ? (
          <Link href={userRoute(reply.author.id)}>
            <a>{reply.author.displayName}</a>
          </Link>
        ) : (
          '[deleted]'
        )}
      </strong>
      <span className="ms-2" />
      <Link href={replyRoute({ cardId: props.card.id, replyId: reply.id })}>
        <a className="d-flex align-items-center">
          <BiLink className="me-1" />
          <ReactTimeAgo timeStyle="twitter-minute-now" date={reply.createdAt} />
        </a>
      </Link>
      {isPrivate && <span className="ms-2">🔒</span>}
    </span>
  )
}

// Component in "normal" mode
function ShowReply(props: { card: Card; reply: Reply_; afterDelete?: () => void; startEditing: () => void }) {
  const { card, reply } = props
  const settings = replySettings(reply)
  const isPrivate = settings.visibility === 'private'
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
        <div className="d-flex align-items-center" style={{ lineHeight: '100%', marginBottom: '.3em' }}>
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
        <RenderedMarkdown className="woc-reply-content rendered-content small" markdown={reply.content} />
      </div>
    </div>
  )
}

// Component in "edit" mode
function EditReply(props: { card: Card; reply: Reply_; stopEditing: () => void }) {
  const editorRef: RefObject<TiptapMethods> = React.useRef(null)
  const updateReplyMutation = useUpdateReply()

  const { card, reply } = props
  const settings = replySettings(reply)
  const isPrivate = settings.visibility === 'private'
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
        <div className="d-flex align-items-center" style={{ lineHeight: '100%', marginBottom: '.3em' }}>
          <InfoHeader {...props} />
        </div>
        <Formik
          initialValues={{}}
          onSubmit={async () => {
            if (!editorRef.current) throw Error('Editor is not initialized')
            await updateReplyMutation.mutateAsync({
              replyId: reply.id,
              content: editorRef.current.getMarkdown(),
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
                {formik.isSubmitting && <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
              </B.Button>
              <B.Button size="sm" variant="secondary" type="button" className="ms-2" onClick={props.stopEditing}>
                Cancel
              </B.Button>
            </B.Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export function ReplyComponent(props: { card: Card; reply: Reply_; afterDelete?: () => void }) {
  const [editing, setEditing] = useState(false)
  return editing ? (
    <EditReply {...props} stopEditing={() => setEditing(false)} />
  ) : (
    <ShowReply {...props} startEditing={() => setEditing(true)} />
  )
}
