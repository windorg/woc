import { Card, Comment } from '@prisma/client'
import { commentSettings } from '../lib/model-settings'
import { Dropdown } from 'react-bootstrap'
import React from 'react'
import Link from 'next/link'
import { renderMarkdown } from '../lib/markdown'
import ReactTimeAgo from 'react-time-ago'
import { BiLink, BiPencil, BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import { AiOutlinePushpin } from 'react-icons/ai'
import copy from 'copy-to-clipboard'
import { callUpdateComment } from '../pages/api/comments/update'
import styles from './commentComponent.module.scss'
import { callDeleteComment } from 'pages/api/comments/delete'

function MenuCopyLink(props: { card: Card, comment: Comment }) {
  return <Dropdown.Item
    onClick={() => { copy(`https://windofchange.me/ShowCard?cardId=${props.card.id}#comment-${props.comment.id}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </Dropdown.Item>
}

function MenuPin(props: { pinned, updateComment }) {
  return props.pinned
    ?
    <Dropdown.Item onClick={() => props.updateComment({ pinned: false })}>
      <AiOutlinePushpin className="icon" /><span>Unpin</span>
    </Dropdown.Item>
    :
    <Dropdown.Item onClick={() => props.updateComment({ pinned: true })}>
      <AiOutlinePushpin className="icon" /><span>Pin</span>
    </Dropdown.Item>
}

function MenuMakePrivate(props: { private, updateComment }) {
  return props.private
    ?
    <Dropdown.Item onClick={() => props.updateComment({ private: false })}>
      <BiLockOpen className="icon" /><span>Make public</span>
    </Dropdown.Item>
    :
    <Dropdown.Item onClick={() => props.updateComment({ private: true })}>
      <BiLock className="icon" /><span>Make private</span>
    </Dropdown.Item>
}

function MenuDelete(props: { deleteComment }) {
  return <Dropdown.Item className="text-danger"
    onClick={() => props.deleteComment()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </Dropdown.Item>
}

export function CommentComponent(props: {
  card: Card
  comment: Comment
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
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
          <Dropdown className={`${styles.moreButton} link-button ms-3 d-flex align-items-center`}>
            <Dropdown.Toggle as="span" className="d-flex align-items-center">
              <BiDotsHorizontal className="me-1" /><span>More</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <MenuCopyLink card={card} comment={comment} />
              <MenuMakePrivate private={isPrivate} updateComment={updateComment} />
              <MenuPin pinned={settings.pinned} updateComment={updateComment} />
              <Dropdown.Divider />
              <MenuDelete deleteComment={deleteComment} />
            </Dropdown.Menu>
          </Dropdown>

          {/* TODO implement editing and deletion */}
        </div>
      </div>
      <div className="rendered-content">
        {renderMarkdown(comment.content)}
      </div>
      {/* TODO render replies */}
    </div>
  )
}


