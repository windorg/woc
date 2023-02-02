import type * as GQL from 'generated/graphql/graphql'
import * as B from 'react-bootstrap'
import React from 'react'
import {
  BiPencil,
  BiDotsHorizontal,
  BiTrashAlt,
  BiLockOpen,
  BiLock,
  BiShareAlt,
  BiArchiveOut,
  BiArchiveIn,
} from 'react-icons/bi'
import { HiArrowRight } from 'react-icons/hi'
import copy from 'copy-to-clipboard'
import styles from './actionMenu.module.scss'
import { cardRoute } from 'lib/routes'
import { LinkButton } from './linkButton'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { evictCardChildren } from '@lib/graphql/cache'
import { Visibility } from '@lib/graphql/schema/visibility'

function ButtonEdit(props: { onEdit }) {
  return (
    <LinkButton onClick={props.onEdit} icon={<BiPencil />}>
      Edit
    </LinkButton>
  )
}

function ButtonMakePrivate(props: { private; updateCard }) {
  return (
    <LinkButton
      onClick={() => props.updateCard({ private: !props.private })}
      icon={props.private ? <BiLockOpen /> : <BiLock />}
    >
      {props.private ? 'Make public' : 'Make private'}
    </LinkButton>
  )
}

function MenuCopyLink(props: { card: Pick<GQL.Card, 'id'> }) {
  return (
    <B.Dropdown.Item
      onClick={() => {
        copy(`https://windofchange.me${cardRoute(props.card.id)}`)
      }}
    >
      <BiShareAlt className="icon" />
      <span>Copy link</span>
    </B.Dropdown.Item>
  )
}

function MenuMove(props: { onMove }) {
  return (
    <B.Dropdown.Item onClick={props.onMove}>
      <HiArrowRight className="icon" />
      <span>Move to</span>
    </B.Dropdown.Item>
  )
}

function MenuArchive(props: { archived; updateCard }) {
  return (
    <B.Dropdown.Item onClick={() => props.updateCard({ archived: !props.archived })}>
      {props.archived ? (
        <>
          <BiArchiveOut className="icon" />
          <span>Unarchive</span>
        </>
      ) : (
        <>
          <BiArchiveIn className="icon" />
          <span>Archive</span>
        </>
      )}
    </B.Dropdown.Item>
  )
}

function MenuDelete(props: { deleteCard }) {
  return (
    <B.Dropdown.Item className="text-danger" onClick={() => props.deleteCard()}>
      <BiTrashAlt className="icon" />
      <span>Delete</span>
    </B.Dropdown.Item>
  )
}

const useUpdateCard = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation updateCard($id: UUID!, $archived: Boolean, $private: Boolean) {
        updateCard(input: { id: $id, archived: $archived, private: $private }) {
          card {
            id
            archived
            visibility
          }
        }
      }
    `)
    // We don't have to evict anything from the cache because Apollo will automatically update the cache with newly fetched data.
  )
  return { do: action, result }
}

const useDeleteCard = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation deleteCard($id: UUID!) {
        deleteCard(id: $id) {
          parent {
            id
          }
          ownerId
        }
      }
    `),
    {
      update: (cache, { data }) => {
        evictCardChildren(cache, {
          cardId: data!.deleteCard.parent?.id || null,
          ownerId: data!.deleteCard.ownerId,
        })
      },
    }
  )
  return { do: action, result }
}

// "More" button with a dropdown
function CardMenu(props: {
  card: Pick<GQL.Card, 'id' | 'canEdit' | 'archived'>
  onMove: () => void
  afterDelete?: () => void
}) {
  const { card } = props

  const updateCardMutation = useUpdateCard()
  const deleteCardMutation = useDeleteCard()

  const updateCard = async (data) => {
    await updateCardMutation.do({ variables: { id: card.id, ...data } })
  }

  const deleteCard = async () => {
    await deleteCardMutation.do({ variables: { id: card.id } })
    if (props.afterDelete) props.afterDelete()
  }

  return (
    <B.Dropdown className="link-button text-muted d-inline-flex align-items-center">
      <B.Dropdown.Toggle as="span" className="d-flex align-items-center">
        <BiDotsHorizontal className="me-1" />
        <span>More</span>
      </B.Dropdown.Toggle>
      <B.Dropdown.Menu className={styles.actionMenu}>
        <MenuCopyLink card={card} />
        {props.card.canEdit && (
          <>
            <MenuMove onMove={props.onMove} />
            <MenuArchive archived={card.archived} updateCard={updateCard} />
            <B.Dropdown.Divider />
            <MenuDelete deleteCard={deleteCard} />
          </>
        )}
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}

export function CardActions(props: {
  card: Pick<GQL.Card, 'id' | 'canEdit' | 'archived' | 'visibility'>
  onEdit: () => void
  onMove: () => void
  afterDelete?: () => void
}) {
  const { card } = props
  const isPrivate = card.visibility === Visibility.Private

  const updateCardMutation = useUpdateCard()
  const updateCard = async (data) => {
    await updateCardMutation.do({ variables: { id: card.id, ...data } })
  }

  return (
    <B.Stack direction="horizontal" gap={4}>
      {card.canEdit && <ButtonEdit onEdit={props.onEdit} />}
      {card.canEdit && <ButtonMakePrivate private={isPrivate} updateCard={updateCard} />}
      <CardMenu {...props} />
    </B.Stack>
  )
}
