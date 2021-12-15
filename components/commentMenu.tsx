import { Card, Comment } from '@prisma/client'
import { Dropdown } from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import { AiOutlinePushpin } from 'react-icons/ai'
import actionMenuStyles from './actionMenu.module.scss'
import copy from 'copy-to-clipboard'
import { callUpdateComment } from 'pages/api/comments/update'
import { callDeleteComment } from 'pages/api/comments/delete'
import { commentSettings } from '../lib/model-settings'

function MenuCopyLink(props: { card: Card, comment: Comment }) {
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

export function CommentMenu(props: {
  card: Card
  comment: Comment & { canEdit: boolean }
  afterCommentUpdated: (newComment: Comment) => void
  afterCommentDeleted: () => void
}) {
  const { card, comment } = props
  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'

  const updateComment = async (data) => {
    const diff = await callUpdateComment({ commentId: comment.id, ...data })
    props.afterCommentUpdated({ ...comment, ...diff })
  }

  const deleteComment = async () => {
    await callDeleteComment({ commentId: comment.id })
    props.afterCommentDeleted()
  }

  // TODO confirmation dialog for deletion
  // TODO should not call 'deleteComment' on the DOM if deletion actually fails
  return (
    <Dropdown className="link-button ms-3 d-flex align-items-center">
      <Dropdown.Toggle as="span" className="d-flex align-items-center">
        <BiDotsHorizontal className="me-1" /><span>More</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className={actionMenuStyles.actionMenu}>
        <MenuCopyLink card={card} comment={comment} />
        {props.comment.canEdit && <>
          <MenuMakePrivate private={isPrivate} updateComment={updateComment} />
          <MenuPin pinned={settings.pinned} updateComment={updateComment} />
          <Dropdown.Divider />
          <MenuDelete deleteComment={deleteComment} />
        </>}
      </Dropdown.Menu>
    </Dropdown>
  )
} 
