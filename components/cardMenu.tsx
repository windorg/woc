import { Card } from '@prisma/client'
import { cardSettings } from '../lib/model-settings'
import * as B from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt, BiArchiveOut, BiArchiveIn } from 'react-icons/bi'
import copy from 'copy-to-clipboard'
import styles from './actionMenu.module.scss'
import { cardRoute } from 'lib/routes'
import { useUpdateCard, useDeleteCard } from 'lib/queries/cards'

function MenuCopyLink(props: { card: Card }) {
  return <B.Dropdown.Item
    onClick={() => { copy(`https://windofchange.me${cardRoute(props.card.id)}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </B.Dropdown.Item>
}

function MenuMakePrivate(props: { private, updateCard }) {
  return (
    <B.Dropdown.Item onClick={() => props.updateCard({ private: !props.private })}>
      {props.private
        ? <><BiLockOpen className="icon" /><span>Make public</span></>
        : <><BiLock className="icon" /><span>Make private</span></>}
    </B.Dropdown.Item>
  )
}

function MenuArchive(props: { archived, updateCard }) {
  return (
    <B.Dropdown.Item onClick={() => props.updateCard({ archived: !props.archived })}>
      {props.archived
        ? <><BiArchiveOut className="icon" /><span>Unarchive</span></>
        : <><BiArchiveIn className="icon" /><span>Archive</span></>}
    </B.Dropdown.Item>
  )
}

function MenuDelete(props: { deleteCard }) {
  return <B.Dropdown.Item className="text-danger"
    onClick={() => props.deleteCard()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </B.Dropdown.Item>
}

// "More" button with a B.dropdown
export function CardMenu(props: {
  card: Card & { canEdit: boolean }
  afterDelete?: () => void
}) {
  const { card } = props
  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'

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
        <BiDotsHorizontal className="me-1" /><span>More</span>
      </B.Dropdown.Toggle>
      <B.Dropdown.Menu className={styles.actionMenu}>
        <MenuCopyLink card={card} />
        {props.card.canEdit && <>
          <MenuMakePrivate private={isPrivate} updateCard={updateCard} />
          <MenuArchive archived={settings.archived} updateCard={updateCard} />
          <B.Dropdown.Divider />
          <MenuDelete deleteCard={deleteCard} />
        </>
        }
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}