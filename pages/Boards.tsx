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
import { Query } from '@components/query'

const useGetTopLevelCards = () => {
  return useQuery(
    graphql(`
      query getTopLevelCards {
        topLevelCards {
          id
          createdAt
          title
          ownerId
          visibility
        }
      }
    `)
  )
}

const Boards: NextPage = () => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null

  const topLevelCardsQuery = useGetTopLevelCards()

  return (
    <>
      <Query queries={{ topLevelCardsQuery }}>
        {({ topLevelCardsQuery: { topLevelCards } }) => {
          const [userCards, othersCards] = userId
            ? _.partition(topLevelCards, (card) => card.ownerId === userId)
            : [[], topLevelCards]

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
                    boards={userCards}
                    kind="own-board"
                  />
                  <BoardsList
                    allowNewBoard={false}
                    heading="Others' public boards"
                    boards={othersCards}
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
                    boards={othersCards}
                    kind="other-board"
                  />
                </>
              )}
            </>
          )
        }}
      </Query>
    </>
  )
}

export default Boards
