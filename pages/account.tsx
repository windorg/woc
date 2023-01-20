import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React from 'react'
import { AccountCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import * as B from 'react-bootstrap'
import { beeminderAuthUrl } from 'lib/beeminder'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'

type Props = Record<string, never>

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {}
  return serialize(props)
}

const getCurrentUserDocument = graphql(`
  query getCurrentUser {
    currentUser {
      displayName
      handle
      beeminderUsername
    }
  }
`)

const Account: NextPage<SuperJSONResult> = (serializedInitialProps) => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null
  const initialProps = deserialize<Props>(serializedInitialProps)

  const userQuery = useQuery(getCurrentUserDocument)
  const user = userQuery.data ? userQuery.data.currentUser : null

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
              <Link href={beeminderAuthUrl()}>
                <a>Connect to Beeminder</a>
              </Link>
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

Account.getInitialProps = getInitialProps

export default Account
