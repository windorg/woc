import type * as GQL from 'generated/graphql/graphql'
import { Reply } from '@prisma/client'
import * as B from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiShareAlt } from 'react-icons/bi'
import actionMenuStyles from './actionMenu.module.scss'
import copy from 'copy-to-clipboard'
import { replySettings } from '../lib/model-settings'
import { replyRoute } from 'lib/routes'
import { useDeleteReply } from 'lib/queries/replies'

function MenuCopyLink(props: { card: Pick<GQL.Card, 'id'>; reply: Reply }) {
  const link = `https://windofchange.me${replyRoute({
    cardId: props.card.id,
    replyId: props.reply.id,
  })}`
  return (
    <B.Dropdown.Item
      onClick={() => {
        copy(link)
      }}
    >
      <BiShareAlt className="icon" />
      <span>Copy link</span>
    </B.Dropdown.Item>
  )
}

// TODO allow private replies

// function MenuMakePrivate(props: { private, updateReply }) {
//   return (
//     <B.Dropdown.Item onClick={() => props.updateReply({ private: !props.private })}>
//       {props.private
//         ? <><BiLockOpen className="icon" /><span>Make public</span></>
//         : <><BiLock className="icon" /><span>Make private</span></>}
//     </B.Dropdown.Item>
//   )
// }

function MenuDelete(props: { deleteReply }) {
  return (
    <B.Dropdown.Item className="text-danger" onClick={() => props.deleteReply()}>
      <BiTrashAlt className="icon" />
      <span>Delete</span>
    </B.Dropdown.Item>
  )
}

export function ReplyMenu(props: {
  card: Pick<GQL.Card, 'id'>
  reply: Reply & { canEdit: boolean; canDelete: boolean }
  afterDelete?: () => void
}) {
  const { card, reply } = props
  const settings = replySettings(reply)
  const deleteReplyMutation = useDeleteReply()

  const deleteReply = async () => {
    await deleteReplyMutation.mutateAsync({ replyId: reply.id })
    if (props.afterDelete) props.afterDelete()
  }

  // TODO confirmation dialog for deletion
  // TODO should not call 'deleteReply' on the DOM if deletion actually fails
  return (
    <B.Dropdown className="link-button d-flex align-items-center">
      <B.Dropdown.Toggle as="span" className="d-flex align-items-center">
        <BiDotsHorizontal className="me-1" />
        <span>More</span>
      </B.Dropdown.Toggle>
      <B.Dropdown.Menu className={actionMenuStyles.actionMenu}>
        <MenuCopyLink card={card} reply={reply} />
        {props.reply.canDelete && (
          <>
            <B.Dropdown.Divider />
            <MenuDelete deleteReply={deleteReply} />
          </>
        )}
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}
