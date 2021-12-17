import { Card, Comment, Reply } from '@prisma/client'
import { Dropdown } from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import actionMenuStyles from './actionMenu.module.scss'
import copy from 'copy-to-clipboard'
import { callUpdateReply } from 'pages/api/replies/update'
import { callDeleteReply } from 'pages/api/replies/delete'
import { replySettings } from '../lib/model-settings'

function MenuCopyLink(props: { card: Card, reply: Reply }) {
  return <Dropdown.Item
    onClick={() => { copy(`https://windofchange.me/ShowCard?cardId=${props.card.id}#reply-${props.reply.id}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </Dropdown.Item>
}

// TODO allow private replies

// function MenuMakePrivate(props: { private, updateReply }) {
//   return (
//     <Dropdown.Item onClick={() => props.updateReply({ private: !props.private })}>
//       {props.private
//         ? <><BiLockOpen className="icon" /><span>Make public</span></>
//         : <><BiLock className="icon" /><span>Make private</span></>}
//     </Dropdown.Item>
//   )
// }

function MenuDelete(props: { deleteReply }) {
  return <Dropdown.Item className="text-danger"
    onClick={() => props.deleteReply()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </Dropdown.Item>
}

export function ReplyMenu(props: {
  card: Card
  reply: Reply & { canEdit: boolean, canDelete: boolean }
  afterReplyUpdated: (newReply: Reply) => void
  afterReplyDeleted: () => void
}) {
  const { card, reply } = props
  const settings = replySettings(reply)

  const deleteReply = async () => {
    await callDeleteReply({ replyId: reply.id })
    props.afterReplyDeleted()
  }

  // TODO confirmation dialog for deletion
  // TODO should not call 'deleteReply' on the DOM if deletion actually fails
  return (
    <Dropdown className="link-button d-flex align-items-center">
      <Dropdown.Toggle as="span" className="d-flex align-items-center">
        <BiDotsHorizontal className="me-1" /><span>More</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className={actionMenuStyles.actionMenu}>
        <MenuCopyLink card={card} reply={reply} />
        {props.reply.canDelete && <>
          <Dropdown.Divider />
          <MenuDelete deleteReply={deleteReply} />
        </>}
      </Dropdown.Menu>
    </Dropdown>
  )
} 
