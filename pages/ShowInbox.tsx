import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import { signIn } from 'next-auth/react'
import React from 'react'
import * as B from 'react-bootstrap'
import { BoardsCrumb, InboxCrumb } from '../components/breadcrumbs'
import { useSession } from 'next-auth/react'
import styles from './ShowInbox.module.scss'
import { InboxItemComponent } from 'components/inboxItem'
import { InboxItem } from 'lib/inbox'
import { useInbox } from 'lib/queries/inbox'
import { orderBy } from '@lib/array'

const ShowInbox: NextPage = () => {
  const { data: session } = useSession()

  const inboxQuery = useInbox({})

  if (inboxQuery.status === 'loading' || inboxQuery.status === 'idle')
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )
  if (inboxQuery.status === 'error')
    return <B.Alert variant="danger">{(inboxQuery.error as Error).message}</B.Alert>

  const inboxItems = inboxQuery.data

  return (
    <>
      <Head>
        <title>Inbox / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb />
        <InboxCrumb active />
      </B.Breadcrumb>

      <h1>Inbox</h1>

      {session ? (
        <div className={`${styles.inboxItems} mb-5`}>
          {orderBy(inboxItems, (x) => x.reply.createdAt, 'desc').map((x) => (
            <InboxItemComponent key={x.id} item={x} />
          ))}
        </div>
      ) : (
        <>
          <p>
            Please{' '}
            <a href="#" onClick={async () => signIn()}>
              log in
            </a>{' '}
            to see your inbox.
          </p>
        </>
      )}
    </>
  )
}

export default ShowInbox
