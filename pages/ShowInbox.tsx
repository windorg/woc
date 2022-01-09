import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { prisma } from '../lib/db'
import { signIn } from "next-auth/react"
import React from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb, InboxCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import styles from './ShowInbox.module.scss'
import { InboxItemComponent } from 'components/inboxItem'
import { getInboxItems, InboxItem } from 'lib/inbox'

type Props = {
  inboxItems: InboxItem[]
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  if (session) {
    // Logged in
    const props: Props = {
      inboxItems: await getInboxItems(session.userId)
    }
    return {
      props: serialize(props)
    }
  } else {
    // Not logged in
    const props: Props = {
      inboxItems: []
    }
    return {
      props: serialize(props)
    }
  }
}

const ShowInbox: NextPage<SuperJSONResult> = (props) => {
  const { data: session } = useSession()
  const { inboxItems } = deserialize<Props>(props)

  return (
    <>
      <Head>
        <title>Inbox / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb />
        <InboxCrumb active />
      </Breadcrumb>

      <h1>Inbox</h1>

      {session
        ?
        <div className={styles.inboxItems}>
          {_.orderBy(inboxItems, ['createdAt'], ['desc'])
            .map(x => <InboxItemComponent key={x.id} item={x} />)
          }
        </div>
        :
        <>
          <p>
            Please <a href="#" onClick={async () => signIn()}>log in</a> to see your inbox.
          </p>
        </>
      }
    </>
  )
}

export default ShowInbox
