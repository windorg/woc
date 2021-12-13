import { Card, Comment } from '@prisma/client'
import { commentSettings } from '../lib/model-settings'
import { Dropdown } from 'react-bootstrap'
import React, { createRef, RefObject, useState } from 'react'
import Link from 'next/link'
import { RenderedMarkdown, markdownToHtml } from '../lib/markdown'
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil, BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import { AiOutlinePushpin } from 'react-icons/ai'
import copy from 'copy-to-clipboard'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { callUpdateComment } from '../pages/api/comments/update'
import styles from './commentComponent.module.scss'
import { callDeleteComment } from 'pages/api/comments/delete'
import { Tiptap, TiptapMethods } from './tiptap'

type Comment_ = Comment & {
  canEdit: boolean
}

// Timestamp & the little lock
function InfoHeader(props: { card: Card, comment: Comment_ }) {
  const settings = commentSettings(props.comment)
  const isPrivate = settings.visibility === 'private'
  return (
    <span className="small d-flex">
      <Link href={`/ShowCard?cardId=${props.card.id}#comment-${props.comment.id}`}>
        <a className="d-flex align-items-center">
          <BiLink className="me-1" />
          <ReactTimeAgo timeStyle="twitter-minute-now" date={props.comment.createdAt} />
        </a>
      </Link>
      {isPrivate && <span className="ms-2">🔒</span>}
    </span>
  )
}

function MenuCopyLink(props: { card: Card, comment: Comment_ }) {
  return <Dropdown.Item
    onClick={() => { copy(`https://windofchange.me/ShowCard?cardId=${props.card.id}#comment-${props.comment.id}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </Dropdown.Item>
}

function MenuPin(props: { pinned, updateComment }) {
  return (
    <Dropdown.Item onClick={() => props.updateComment({ pinned: !props.pinned })}>
      {props.pinned
        ? <><AiOutlinePushpin className="icon" /><span>Unpin</span></>
        : <><AiOutlinePushpin className="icon" /><span>Pin</span></>}
    </Dropdown.Item>
  )
}

function MenuMakePrivate(props: { private, updateComment }) {
  return (
    <Dropdown.Item onClick={() => props.updateComment({ private: !props.private })}>
      {props.private
        ? <><BiLockOpen className="icon" /><span>Make public</span></>
        : <><BiLock className="icon" /><span>Make private</span></>}
    </Dropdown.Item>
  )
}

function MenuDelete(props: { deleteComment }) {
  return <Dropdown.Item className="text-danger"
    onClick={() => props.deleteComment()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </Dropdown.Item>
}

// Component in "normal" mode
function ShowComment(props: {
  card: Card
  comment: Comment_
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
  startEditing: () => void
}) {
  const { card, comment } = props
  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'
  const classes = `
    ${styles.comment}
    ${isPrivate ? styles.commentPrivate : ""}
    ${settings.pinned ? styles.commentPinned : ""}
    `

  const updateComment = async (data) => {
    const diff = await callUpdateComment({ commentId: comment.id, ...data })
    props.afterCommentUpdated({ ...comment, ...diff })
  }

  const deleteComment = async () => {
    await callDeleteComment({ commentId: comment.id })
    props.afterCommentDeleted()
  }

  return (
    <div key={comment.id} id={`comment-${comment.id}`} className={classes}>
      <div className="d-flex justify-content-between" style={{ marginBottom: ".3em" }}>
        <InfoHeader {...props} />
        <div className="d-inline-flex small text-muted" style={{ marginTop: "3px" }}>
          {props.comment.canEdit &&
            <span className="link-button d-flex align-items-center"
              onClick={props.startEditing}>
              <BiPencil className="me-1" /><span>Edit</span>
            </span>
          }
          <Dropdown className={`${styles.moreButton} link-button ms-3 d-flex align-items-center`}>
            <Dropdown.Toggle as="span" className="d-flex align-items-center">
              <BiDotsHorizontal className="me-1" /><span>More</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <MenuCopyLink card={card} comment={comment} />
              {props.comment.canEdit && <>
                <MenuMakePrivate private={isPrivate} updateComment={updateComment} />
                <MenuPin pinned={settings.pinned} updateComment={updateComment} />
                <Dropdown.Divider />
                <MenuDelete deleteComment={deleteComment} />
              </>}
            </Dropdown.Menu>
          </Dropdown>
          {/* TODO confirmation dialog for deletion */}
          {/* TODO should not call 'deleteComment' on the DOM if deletion actually fails */}
        </div>
      </div>
      <RenderedMarkdown className="rendered-content" markdown={comment.content} />
      {/* TODO render replies */}
    </div>
  )
}

// Component in "edit" mode
class EditComment extends React.Component<{
  card: Card
  comment: Comment_
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
  stopEditing: () => void
}> {
  private editorRef: RefObject<TiptapMethods>
  constructor(props) {
    super(props)
    this.editorRef = createRef()
  }

  render() {
    const { card, comment } = this.props
    const settings = commentSettings(comment)
    const isPrivate = settings.visibility === 'private'
    const classes = `
      ${styles.comment}
      ${isPrivate ? styles.commentPrivate : ""}
      ${settings.pinned ? styles.commentPinned : ""}
      `

    const handleSubmit = async (e?: any) => {
      e && e.preventDefault()
      if (!this.editorRef.current) throw Error("Editor is not initialized")
      const diff = await callUpdateComment({
        commentId: comment.id,
        content: this.editorRef.current.getMarkdown()
      })
      const newComment = { ...comment, ...diff }
      this.props.stopEditing()
      this.props.afterCommentUpdated(newComment)
    }

    return (
      <div key={comment.id} id={`comment-${comment.id}`} className={classes}>
        <div className="d-flex justify-content-between" style={{ marginBottom: ".3em" }}>
          <InfoHeader {...this.props} />
        </div>
        <Form onSubmit={handleSubmit} >
          <div className="mb-2">
            <Tiptap
              content={markdownToHtml(this.props.comment.content)}
              autoFocus
              onSubmit={handleSubmit}
              ref={this.editorRef} />
          </div>
          <Button size="sm" variant="primary" type="submit">Save</Button>
          <Button size="sm" variant="secondary" type="button" className="ms-2"
            onClick={this.props.stopEditing}>
            Cancel
          </Button>
        </Form>
      </div>
    )
  }
}

export function CommentComponent(props: {
  card: Card
  comment: Comment_
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  return (
    editing
      ? <EditComment {...props} stopEditing={() => setEditing(false)} />
      : <ShowComment {...props} startEditing={() => setEditing(true)} />
  )
}


