import type * as GQL from 'generated/graphql/graphql'
import * as B from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import { AiOutlinePushpin } from 'react-icons/ai'
import actionMenuStyles from './actionMenu.module.scss'
import copy from 'copy-to-clipboard'
import { commentRoute } from 'lib/routes'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { evictCardComments } from '@lib/graphql/cache'

const useUpdateComment = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation updateComment($id: UUID!, $pinned: Boolean, $private: Boolean) {
        updateComment(input: { id: $id, pinned: $pinned, private: $private }) {
          comment {
            id
            pinned
            visibility
          }
        }
      }
    `)
    // We don't have to evict anything from the cache because Apollo will automatically update the cache with newly fetched data.
  )
  return { do: action, result }
}

const useDeleteComment = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation deleteComment($id: UUID!) {
        deleteComment(id: $id) {
          card {
            id
          }
        }
      }
    `),
    {
      update: (cache, { data }) => {
        evictCardComments(cache, { cardId: data!.deleteComment.card.id })
      },
    }
  )
  return { do: action, result }
}

function MenuCopyLink(props: { card: Pick<GQL.Card, 'id'>; comment: Pick<GQL.Comment, 'id'> }) {
  const link = `https://windofchange.me${commentRoute({
    cardId: props.card.id,
    commentId: props.comment.id,
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

function MenuPin(props: { pinned; updateComment }) {
  return (
    <B.Dropdown.Item onClick={() => props.updateComment({ pinned: !props.pinned })}>
      {props.pinned ? (
        <>
          <AiOutlinePushpin className="icon" />
          <span>Unpin</span>
        </>
      ) : (
        <>
          <AiOutlinePushpin className="icon" />
          <span>Pin</span>
        </>
      )}
    </B.Dropdown.Item>
  )
}

function MenuMakePrivate(props: { private; updateComment }) {
  return (
    <B.Dropdown.Item onClick={() => props.updateComment({ private: !props.private })}>
      {props.private ? (
        <>
          <BiLockOpen className="icon" />
          <span>Make public</span>
        </>
      ) : (
        <>
          <BiLock className="icon" />
          <span>Make private</span>
        </>
      )}
    </B.Dropdown.Item>
  )
}

function MenuDelete(props: { deleteComment }) {
  return (
    <B.Dropdown.Item className="text-danger" onClick={() => props.deleteComment()}>
      <BiTrashAlt className="icon" />
      <span>Delete</span>
    </B.Dropdown.Item>
  )
}

export function CommentMenu(props: {
  card: Pick<GQL.Card, 'id'>
  comment: Pick<GQL.Comment, 'id' | 'canEdit' | 'pinned' | 'visibility'>
  afterDelete?: () => void
}) {
  const { card, comment } = props
  const isPrivate = comment.visibility === 'private'

  const updateCommentMutation = useUpdateComment()
  const deleteCommentMutation = useDeleteComment()

  const updateComment = async (data) => {
    await updateCommentMutation.do({ variables: { id: comment.id, ...data } })
  }

  const deleteComment = async () => {
    await deleteCommentMutation.do({ variables: { id: comment.id } })
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
        <MenuCopyLink card={card} comment={comment} />
        {props.comment.canEdit && (
          <>
            <MenuMakePrivate private={isPrivate} updateComment={updateComment} />
            <MenuPin pinned={comment.pinned} updateComment={updateComment} />
            <B.Dropdown.Divider />
            <MenuDelete deleteComment={deleteComment} />
          </>
        )}
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}
