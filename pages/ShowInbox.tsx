import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { prisma } from '../lib/db'
import React from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb, InboxCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, useSession } from 'next-auth/react'
import { canSeeReply } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import filterAsync from 'node-filter-async'
import _ from 'lodash'
import styles from './ShowInbox.module.scss'
import { InboxItem, InboxItemComponent } from 'components/inboxItem'

type Props = {
  inboxItems: InboxItem[]
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  if (session) {
    // Logged in
    const unreadReplies: InboxItem[] =
      await prisma.subscriptionUpdate.findMany({
        where: {
          subscriberId: session.userId,
          updateKind: 'suk_reply',
          isRead: false,
        },
        include: {
          reply: {
            include: {
              author: { select: { id: true, email: true, displayName: true } },
              comment: { select: { cardId: true } },
            }
          },
        },
      }).then(xs => _.compact(xs.map(x => x.reply)))
        .then(xs => filterAsync(xs, x => canSeeReply(session.userId, x.id)))
        .then(xs => xs.map(x => ({ ...x, tag: 'reply' })))
    const props: Props = {
      inboxItems: unreadReplies
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
            Please <Link href="/LoginOrSignup"><a>log in</a></Link> to see your inbox.
          </p>
        </>
      }
    </>
  )
}

export default ShowInbox
