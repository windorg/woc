import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board } from '@prisma/client'
import { prisma } from '../lib/db'
import { boardSettings, checkPrivate } from '../lib/model-settings'
import React from 'react'
import Card from 'react-bootstrap/Card'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'

type Board_ = Board & { owner: { handle: string, displayName: string } }

// TODO: handle both logged-in and logged-out cases
type Props = {
  allBoards: Board_[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  let allBoards = await prisma.board.findMany({
    include: {
      owner: { select: { handle: true, displayName: true } }
    },
    orderBy: { createdAt: "desc" }
  })
  allBoards = allBoards.filter((board) => !checkPrivate(boardSettings(board).visibility))
  return {
    props: {
      allBoards
    }
  }
}

function renderOthersBoard(board: Board_) {
  const isPrivate = checkPrivate(boardSettings(board).visibility)
  return (
    <Card key={board.id} className={`woc-board mt-3 mb-3 ${isPrivate ? "woc-board-private" : ""}`}>
      <Card.Body>
        <h3>
          {isPrivate && "🔒 "}
          <Link href={`/ShowBoard?boardId=${board.id}`}>
            <a className="text-muted">
              {board.title}
            </a>
          </Link>
        </h3>
        <Link href={`/ShowUser?userId=${board.ownerId}`}>
          <a>
            <span>
              <span className="me-2">{board.owner.displayName}</span>
              <em>@{board.owner.handle}</em>
            </span>
          </a>
        </Link>
      </Card.Body>
    </Card>
  )
}

const Boards: NextPage<Props> = ({ allBoards }) => {
  return (
    <>
      <Head>
        <title>Boards / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb active />
      </Breadcrumb>

      <p>To create your own boards, please <a href="/LoginOrSignup">sign up</a>.</p>
      <h1 className="mt-5">Public boards</h1>
      <div className="row-cols-1 row-cols-md2">
        {allBoards.map((board, _) => renderOthersBoard(board))}
      </div>
    </>
  )
}

export default Boards
