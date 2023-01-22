import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React from 'react'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn, useSession } from 'next-auth/react'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'

const _getTopLevelCards = graphql(`
  query getTopLevelCards {
    topLevelCards {
      id
      title
      ownerId
      visibility
    }
  }
`)

const Boards: NextPage = () => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null

  const topLevelCardsQuery = useQuery(_getTopLevelCards)

  if (topLevelCardsQuery.error)
    return <B.Alert variant="danger">{topLevelCardsQuery.error.message}</B.Alert>
  if (!topLevelCardsQuery.data)
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )

  const boards = topLevelCardsQuery.data.topLevelCards

  const [userBoards, otherBoards] = userId
    ? _.partition(boards, (board) => board.ownerId === userId)
    : [[], boards]

  return (
    <>
      <Head>
        <title>Boards / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb active />
      </B.Breadcrumb>

      {userId ? (
        <>
          <BoardsList
            allowNewBoard={true}
            heading="Your boards"
            boards={userBoards}
            kind="own-board"
          />
          <BoardsList
            allowNewBoard={false}
            heading="Others' public boards"
            boards={otherBoards}
            kind="other-board"
          />
        </>
      ) : (
        <>
          <p>
            To create your own boards, please{' '}
            <a href="#" onClick={async () => signIn()}>
              log in
            </a>{' '}
            or <Link href="/Signup">sign up</Link>.
          </p>
          <BoardsList
            allowNewBoard={false}
            heading="Public boards"
            boards={otherBoards}
            kind="other-board"
          />
        </>
      )}
    </>
  )
}

export default Boards
