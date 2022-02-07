import { Board } from '@prisma/client'
import { boardSettings } from '../lib/model-settings'
import React from 'react'
import { BiPencil, BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import copy from 'copy-to-clipboard'
import styles from './actionMenu.module.scss'
import { boardRoute } from 'lib/routes'
import { useDeleteBoard, useUpdateBoard } from 'lib/queries/boards'
import { UpdateBoardBody } from '../pages/api/boards/update'
import * as B from 'react-bootstrap'
import { LinkButton } from './linkButton'

function ButtonEdit(props: { onEdit }) {
  return <LinkButton onClick={props.onEdit} icon={<BiPencil />}>Edit</LinkButton>
}

function ButtonMakePrivate(props: { private, updateBoard }) {
  return (
    <LinkButton
      onClick={() => props.updateBoard({ private: !props.private })}
      icon={props.private ? <BiLockOpen /> : <BiLock />}
    >
      {props.private ? "Make public" : "Make private"}
    </LinkButton>
  )
}

function MenuCopyLink(props: { board: Board }) {
  // TODO should use a local link instead of hardcoding windofchange.me (and in other places too)
  return <B.Dropdown.Item
    onClick={() => { copy(`https://windofchange.me${boardRoute(props.board.id)}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </B.Dropdown.Item>
}

function MenuDelete(props: { deleteBoard }) {
  return <B.Dropdown.Item className="text-danger"
    onClick={() => props.deleteBoard()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </B.Dropdown.Item>
}

// "More" button with a dropdown
function BoardMenu(props: {
  board: Board & { canEdit: boolean }
  afterDelete?: () => void
}) {
  const { board } = props

  const deleteBoardMutation = useDeleteBoard()
  const deleteBoard = async () => {
    await deleteBoardMutation.mutateAsync({ boardId: board.id })
    if (props.afterDelete) props.afterDelete()
  }

  return (
    <B.Dropdown className="link-button text-muted d-inline-flex align-items-center">
      <B.Dropdown.Toggle as="span" className="d-flex align-items-center">
        <BiDotsHorizontal className="me-1" /><span>More</span>
      </B.Dropdown.Toggle>
      <B.Dropdown.Menu className={styles.actionMenu}>
        <MenuCopyLink board={board} />
        {props.board.canEdit && <>
          <B.Dropdown.Divider />
          <MenuDelete deleteBoard={deleteBoard} />
        </>
        }
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}

export function BoardActions(props: {
  board: Board & { canEdit: boolean }
  onEdit: () => void
  afterDelete?: () => void
}) {
  const { board } = props
  const settings = boardSettings(board)
  const isPrivate = settings.visibility === 'private'

  const updateBoardMutation = useUpdateBoard()
  const updateBoard = async (data: Omit<UpdateBoardBody, 'boardId'>) => {
    await updateBoardMutation.mutateAsync({ boardId: board.id, ...data })
  }

  return (
    <B.Stack direction="horizontal" gap={4}>
      {board.canEdit && <ButtonEdit onEdit={props.onEdit} />}
      {board.canEdit && <ButtonMakePrivate private={isPrivate} updateBoard={updateBoard} />}
      <BoardMenu {...props} />
    </B.Stack>
  )
}