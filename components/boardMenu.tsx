import { Board } from '@prisma/client'
import { boardSettings } from '../lib/model-settings'
import { Dropdown } from 'react-bootstrap'
import React from 'react'
import { BiDotsHorizontal, BiTrashAlt, BiLockOpen, BiLock, BiShareAlt } from 'react-icons/bi'
import copy from 'copy-to-clipboard'
import styles from './actionMenu.module.scss'
import { callDeleteBoard } from 'pages/api/boards/delete'
import { boardRoute } from 'lib/routes'
import { useUpdateBoard } from 'lib/queries/board'
import { UpdateBoardBody } from '../pages/api/boards/update'

function MenuCopyLink(props: { board: Board }) {
  // TODO should use a local link instead of hardcoding windofchange.me (and in other places too)
  return <Dropdown.Item
    onClick={() => { copy(`https://windofchange.me${boardRoute(props.board.id)}`) }}>
    <BiShareAlt className="icon" /><span>Copy link</span>
  </Dropdown.Item>
}

function MenuMakePrivate(props: { private, updateBoard }) {
  return (
    <Dropdown.Item onClick={() => props.updateBoard({ private: !props.private })}>
      {props.private
        ? <><BiLockOpen className="icon" /><span>Make public</span></>
        : <><BiLock className="icon" /><span>Make private</span></>}
    </Dropdown.Item>
  )
}

function MenuDelete(props: { deleteBoard }) {
  return <Dropdown.Item className="text-danger"
    onClick={() => props.deleteBoard()}>
    <BiTrashAlt className="icon" /><span>Delete</span>
  </Dropdown.Item>
}

// "More" button with a dropdown
export function BoardMenu(props: {
  board: Board & { canEdit: boolean }
  afterBoardDeleted: () => void
}) {
  const { board } = props
  const settings = boardSettings(board)
  const isPrivate = settings.visibility === 'private'

  const updateBoardMutation = useUpdateBoard()

  const updateBoard = async (data: Omit<UpdateBoardBody, 'boardId'>) => {
    await updateBoardMutation.mutateAsync({ boardId: board.id, ...data })
  }

  const deleteBoard = async () => {
    await callDeleteBoard({ boardId: board.id })
    props.afterBoardDeleted()
  }

  return (
    <Dropdown className="link-button text-muted d-inline-flex align-items-center">
      <Dropdown.Toggle as="span" className="d-flex align-items-center">
        <BiDotsHorizontal className="me-1" /><span>More</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.actionMenu}>
        <MenuCopyLink board={board} />
        {props.board.canEdit && <>
          <MenuMakePrivate private={isPrivate} updateBoard={updateBoard} />
          <Dropdown.Divider />
          <MenuDelete deleteBoard={deleteBoard} />
        </>
        }
      </Dropdown.Menu>
    </Dropdown>
  )
}