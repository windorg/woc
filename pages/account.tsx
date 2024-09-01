import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React from 'react'
import { AccountCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import _ from 'lodash'
import * as B from 'react-bootstrap'
import { beeminderAuthUrl } from 'lib/beeminder'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'

const _getLoggedInUser = graphql(`
  query getLoggedInUser($userId: UUID!) {
    user(id: $userId) {
      id
      displayName
      handle
      beeminderUsername
    }
  }
`)

const Account: NextPage = () => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null

  const userQuery = useQuery(_getLoggedInUser, {
    skip: userId === null,
    variables: { userId: userId! },
  })
  const user = userQuery.data ? userQuery.data.user : null

  return (
    <>
      <Head>
        <title>Your account / WOC</title>
      </Head>

      <B.Breadcrumb>
        <AccountCrumb active />
      </B.Breadcrumb>

      {userId ? (
        <>
          <ul>
            <li>
              <Link href={beeminderAuthUrl()}>Connect to Beeminder</Link>
              {user
                ? user?.beeminderUsername
                  ? ` (connected as ${user.beeminderUsername})`
                  : ''
                : ' (...)'}
            </li>
          </ul>
        </>
      ) : (
        <>
          <p>Please log in.</p>
        </>
      )}
    </>
  )
}

export default Account
