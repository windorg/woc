import type * as GQL from 'generated/graphql/graphql'
import * as B from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiShareAlt } from 'react-icons/bi'
import actionMenuStyles from './actionMenu.module.scss'
import copy from 'copy-to-clipboard'
import { replyRoute } from 'lib/routes'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { evictCommentReplies } from '@lib/graphql/cache'

const useDeleteReply = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation deleteReply($id: UUID!) {
        deleteReply(id: $id) {
          comment {
            id
          }
        }
      }
    `),
    {
      update: (cache, { data }) => {
        evictCommentReplies(cache, { commentId: data!.deleteReply.comment.id })
      },
    }
  )
  return { do: action, result }
}

function MenuCopyLink(props: { card: Pick<GQL.Card, 'id'>; reply: Pick<GQL.Reply, 'id'> }) {
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
  reply: Pick<GQL.Reply, 'id' | 'canEdit' | 'canDelete'>
  afterDelete?: () => void
}) {
  const { card, reply } = props
  const deleteReplyMutation = useDeleteReply()

  const deleteReply = async () => {
    await deleteReplyMutation.do({ variables: { id: reply.id } })
    if (props.afterDelete) props.afterDelete()
  }

  // TODO confirmation dialog for deletion
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
