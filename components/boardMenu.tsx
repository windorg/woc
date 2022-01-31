import { Board } from '@prisma/client'
import { boardSettings } from '../lib/model-settings'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import copy from 'copy-to-clipboard'
import styles from './actionMenu.module.scss'
import { boardRoute } from 'lib/routes'
import { useDeleteBoard, useUpdateBoard } from 'lib/queries/boards'
import { UpdateBoardBody } from '../pages/api/boards/update'
import * as B from 'react-bootstrap'

function MenuCopyLink(props: { board: Board }) {
  // TODO should use a local link instead of hardcoding windofchange.me (and in other places too)
  return <B.Dropdown.Item
    onClick={() => { copy(`https://windofchange.me${boardRoute(props.board.id)}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </B.Dropdown.Item>
}

function MenuMakePrivate(props: { private, updateBoard }) {
  return (
    <B.Dropdown.Item onClick={() => props.updateBoard({ private: !props.private })}>
      {props.private
        ? <><BiLockOpen className="icon" /><span>Make public</span></>
        : <><BiLock className="icon" /><span>Make private</span></>}
    </B.Dropdown.Item>
  )
}

function MenuDelete(props: { deleteBoard }) {
  return <B.Dropdown.Item className="text-danger"
    onClick={() => props.deleteBoard()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </B.Dropdown.Item>
}

// "More" button with a dropdown
export function BoardMenu(props: {
  board: Board & { canEdit: boolean }
  afterDelete?: () => void
}) {
  const { board } = props
  const settings = boardSettings(board)
  const isPrivate = settings.visibility === 'private'

  const updateBoardMutation = useUpdateBoard()
  const deleteBoardMutation = useDeleteBoard()

  const updateBoard = async (data: Omit<UpdateBoardBody, 'boardId'>) => {
    await updateBoardMutation.mutateAsync({ boardId: board.id, ...data })
  }

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
          <MenuMakePrivate private={isPrivate} updateBoard={updateBoard} />
          <B.Dropdown.Divider />
          <MenuDelete deleteBoard={deleteBoard} />
        </>
        }
      </B.Dropdown.Menu>
    </B.Dropdown>
  )
}