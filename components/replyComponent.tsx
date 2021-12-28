import { Card, Reply, User } from '@prisma/client'
import { replySettings } from '../lib/model-settings'
import React, { createRef, RefObject, useState } from 'react'
import Link from 'next/link'
import { RenderedMarkdown, markdownToHtml } from '../lib/markdown'
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil } from 'react-icons/bi'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { callUpdateReply } from '../pages/api/replies/update'
// import styles from './replyComponent.module.scss'
import { Tiptap, TiptapMethods } from './tiptap'
// import { ReplyMenu } from './replyMenu'
import { Gravatar } from './gravatar'
import { LinkButton } from './linkButton'
import { ReplyMenu } from './replyMenu'
import { replyRoute, userRoute } from 'lib/routes'

export type Reply_ = Reply & {
  // The author can be 'null' if it was deleted. We don't delete replies if the author's account is gone.
  author: Pick<User, 'id' | 'email' | 'displayName'> | null
  canEdit: boolean
  // Unlike other entities, canEdit ≠ canDelete for replies. Comment owners can always delete replies, even ones left by
  // other people.
  canDelete: boolean
}

function AuthorPic(props: { author: Pick<User, 'id' | 'email'> | null }) {
  return (
    props.author
      ?
      <Link href={userRoute(props.author.id)}>
        <a><Gravatar email={props.author.email} size="tiny" /></a>
      </Link>
      :
      <Gravatar email="" size="tiny" />
  )
}

// Timestamp & the little lock
function InfoHeader(props: { card: Card, reply: Reply_ }) {
  const { reply } = props
  const settings = replySettings(reply)
  const isPrivate = settings.visibility === 'private'
  // TODO when we implement private replies, check that the lock can be shown
  return (
    <span className="small d-inline-flex">
      <strong>
        {reply.author
          ?
          <Link href={userRoute(reply.author.id)}>
            <a>{reply.author.displayName}</a>
          </Link>
          :
          "[deleted]"
        }
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
function ShowReply(props: {
  card: Card
  reply: Reply_
  afterReplyUpdated: (newReply: Reply) => void
  afterReplyDeleted: () => void
  startEditing: () => void
}) {
  const { card, reply } = props
  const settings = replySettings(reply)
  const isPrivate = settings.visibility === 'private'
  const classes = `
    d-flex
    reply
    ${isPrivate ? "reply-private" : ""}
    `

  // TODO "mark as read"

  return (
    <div id={`reply-${reply.id}`} className={classes}>
      <div className="flex-shrink-0">
        <AuthorPic author={reply.author} />
      </div>
      {/* All the align-items-* is necessary for the edit button to align with the info header */}
      <div className="flex-grow-1 ms-1" style={{ marginTop: "3px" }}>
        <div className="d-flex align-items-center" style={{ lineHeight: "100%", marginBottom: ".3em" }}>
          <InfoHeader {...props} />
          <div className="d-inline-flex small text-muted ms-4 align-items-end">
            {props.reply.canEdit && <>
              <LinkButton onClick={props.startEditing} icon={<BiPencil />}>Edit</LinkButton>
              <span className="me-3" />
            </>
            }
            <ReplyMenu {...props} />
          </div>
        </div>
        <RenderedMarkdown className="woc-reply-content rendered-content small" markdown={reply.content} />
      </div>
    </div>
  )
}

// Component in "edit" mode
class EditReply extends React.Component<{
  card: Card
  reply: Reply_
  afterReplyUpdated: (newReply: Reply) => void
  afterReplyDeleted: () => void
  stopEditing: () => void
}> {
  #editorRef: RefObject<TiptapMethods> = createRef()

  render() {
    const { card, reply } = this.props
    const settings = replySettings(reply)
    const isPrivate = settings.visibility === 'private'
    const classes = `
      d-flex
      reply
      ${isPrivate ? "reply-private" : ""}
      `

    const handleSubmit = async (e?: any) => {
      if (e) e.preventDefault()
      if (!this.#editorRef.current) throw Error("Editor is not initialized")
      const diff = await callUpdateReply({
        replyId: reply.id,
        content: this.#editorRef.current.getMarkdown()
      })
      const newReply = { ...reply, ...diff }
      this.props.stopEditing()
      this.props.afterReplyUpdated(newReply)
    }

    return (
      <div id={`reply-${reply.id}`} className={classes}>
        <div className="flex-shrink-0">
          <AuthorPic author={reply.author} />
        </div>
        <div className="flex-grow-1 ms-1" style={{ marginTop: "3px" }}>
          <div className="d-flex align-items-center" style={{ lineHeight: "100%", marginBottom: ".3em" }}>
            <InfoHeader {...this.props} />
          </div>
          <Form onSubmit={handleSubmit} >
            <div className="mb-2">
              <Tiptap
                className="small"
                content={markdownToHtml(this.props.reply.content)}
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
        </div>
      </div>
    )
  }
}

export function ReplyComponent(props: {
  card: Card
  reply: Reply_
  afterReplyUpdated: (newReply: Reply) => void
  afterReplyDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  return (
    editing
      ? <EditReply {...props} stopEditing={() => setEditing(false)} />
      : <ShowReply {...props} startEditing={() => setEditing(true)} />
  )
}