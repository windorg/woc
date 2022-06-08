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
import { userSettings } from '@lib/model-settings'
import { useUser } from '@lib/queries/user'
import { GetUserData } from './api/users/get'
import { User } from '@prisma/client'

type Props = Record<string, never>

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {}
  return serialize(props)
}

const Account: NextPage<SuperJSONResult> = (serializedInitialProps) => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null
  const initialProps = deserialize<Props>(serializedInitialProps)

  const userQuery = useUser({ userId: userId! })
  const user = userQuery.data ? (userQuery.data as GetUserData & { settings: User['settings'] }) : null

  return (
    <>
      <Head>
        <title>Your account / WOC</title>
      </Head>

      <B.Breadcrumb>
        <AccountCrumb active />
      </B.Breadcrumb>

      {userId
        ?
        <>
          <ul>
            <li>
              <Link href={beeminderAuthUrl()}><a>Connect to Beeminder</a></Link>
              {user
                ? (userSettings(user).beeminderUsername
                  ? ` (connected as ${userSettings(user).beeminderUsername!})` : '')
                : ' (...)'
              }
            </li>
          </ul>
        </>
        :
        <>
          <p>
            Please log in.
          </p>
        </>
      }
    </>
  )
}

Account.getInitialProps = getInitialProps

export default Account
