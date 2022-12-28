import { Card } from '@prisma/client'
import { cardSettings } from '../lib/model-settings'
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
import { useUpdateCard, useDeleteCard } from 'lib/queries/cards'
import { LinkButton } from './linkButton'
import { UpdateCardBody } from 'pages/api/cards/update'

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

function MenuCopyLink(props: { card: Card }) {
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

// "More" button with a dropdown
function CardMenu(props: { card: Card & { canEdit: boolean }; onMove: () => void; afterDelete?: () => void }) {
  const { card } = props
  const settings = cardSettings(card)

  const updateCardMutation = useUpdateCard()
  const deleteCardMutation = useDeleteCard()

  const updateCard = async (data) => {
    await updateCardMutation.mutateAsync({ cardId: card.id, ...data })
  }

  const deleteCard = async () => {
    await deleteCardMutation.mutateAsync({ cardId: card.id })
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
            <MenuArchive archived={settings.archived} updateCard={updateCard} />
            <B.Dropdown.Divider />
            <MenuDelete deleteCard={deleteCard} />
          </>
        )}
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}

export function CardActions(props: {
  card: Card & { canEdit: boolean }
  onEdit: () => void
  onMove: () => void
  afterDelete?: () => void
}) {
  const { card } = props
  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'

  const updateCardMutation = useUpdateCard()
  const updateCard = async (data: Omit<UpdateCardBody, 'cardId'>) => {
    await updateCardMutation.mutateAsync({ cardId: card.id, ...data })
  }

  return (
    <B.Stack direction="horizontal" gap={4}>
      {card.canEdit && <ButtonEdit onEdit={props.onEdit} />}
      {card.canEdit && <ButtonMakePrivate private={isPrivate} updateCard={updateCard} />}
      <CardMenu {...props} />
    </B.Stack>
  )
}
