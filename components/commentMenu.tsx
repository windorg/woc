import { Card, Comment } from '@prisma/client'
import { Dropdown } from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import { AiOutlinePushpin } from 'react-icons/ai'
import actionMenuStyles from './actionMenu.module.scss'
import copy from 'copy-to-clipboard'
import { commentSettings } from '../lib/model-settings'
import { commentRoute } from 'lib/routes'
import { useDeleteComment, useUpdateComment } from 'lib/queries/comments'

function MenuCopyLink(props: { card: Card, comment: Comment }) {
  const link = `https://windofchange.me${commentRoute({ cardId: props.card.id, commentId: props.comment.id })}`
  return <Dropdown.Item
    onClick={() => { copy(link) }}>
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
  afterDelete?: () => void
}) {
  const { card, comment } = props
  const settings = commentSettings(comment)
  const isPrivate = settings.visibility === 'private'

  const updateCommentMutation = useUpdateComment()
  const deleteCommentMutation = useDeleteComment()

  const updateComment = async (data) => {
    await updateCommentMutation.mutateAsync({ commentId: comment.id, ...data })
  }

  const deleteComment = async () => {
    await deleteCommentMutation.mutateAsync({ commentId: comment.id })
    if (props.afterDelete) props.afterDelete()
  }

  // TODO confirmation dialog for deletion
  // TODO should not call 'deleteComment' on the DOM if deletion actually fails
  return (
    <Dropdown className="link-button d-flex align-items-center">
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
