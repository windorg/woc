import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import { signIn } from 'next-auth/react'
import React from 'react'
import * as B from 'react-bootstrap'
import { BoardsCrumb, InboxCrumb } from '../components/breadcrumbs'
import { getSession, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import styles from './ShowInbox.module.scss'
import { InboxItemComponent } from 'components/inboxItem'
import { InboxItem } from 'lib/inbox'
import { useInbox } from 'lib/queries/inbox'
import { serverGetInbox } from './api/inbox/get'
import { isNextExport } from 'lib/export'

type Props = {
  inboxItems?: InboxItem[]
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {}
  if (typeof window === 'undefined') {
    if (!isNextExport(context)) {
      const session = await getSession(context)
      await serverGetInbox(session, {}).then((result) => {
        if (result.success) props.inboxItems = result.data
      })
    }
  }
  return serialize(props)
}

const ShowInbox: NextPage<SuperJSONResult> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { data: session } = useSession()

  const inboxQuery = useInbox({}, { initialData: initialProps?.inboxItems })

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
          {_.orderBy(inboxItems, ['createdAt'], ['desc']).map((x) => (
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

ShowInbox.getInitialProps = getInitialProps

export default ShowInbox
