import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React from 'react'
import * as B from 'react-bootstrap'
import { BoardsCrumb, FeedCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, useSession } from 'next-auth/react'
import { CanSee } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import { FeedItemComponent } from 'components/feedItem'
import styles from './ShowFeed.module.scss'
import { signIn } from "next-auth/react"
import { FeedItem, serverGetFeed } from './api/feed/get'
import { PreloadContext, WithPreload } from 'lib/link-preload'
import { prefetchFeed, useFeed } from 'lib/queries/feed'

type Props = {
  feedItems?: (CanSee & FeedItem)[]
}

async function preload(context: PreloadContext): Promise<void> {
  await Promise.all([
    prefetchFeed(context.queryClient, { days: 3 }),
  ])
}

async function getInitialProps(context: NextPageContext): Promise<SuperJSONResult> {
  const props: Props = {}
  if (typeof window === 'undefined') {
    const session = await getSession(context)
    await serverGetFeed(session, { days: 3 })
      .then(result => { if (result.success) props.feedItems = result.data })
  }
  return serialize(props)
}

const ShowFeed: WithPreload<NextPage<SuperJSONResult>> = (serializedInitialProps) => {
  const initialProps = deserialize<Props>(serializedInitialProps)
  const { data: session } = useSession()

  const feedQuery = useFeed({ days: 3 }, { initialData: initialProps?.feedItems })

  if (feedQuery.status === 'loading' || feedQuery.status === 'idle')
    return <div className="d-flex mt-5 justify-content-center"><B.Spinner animation="border" /></div>
  if (feedQuery.status === 'error') return <B.Alert variant="danger">{(feedQuery.error as Error).message}</B.Alert>

  const feedItems = feedQuery.data

  return (
    <>
      <Head>
        <title>Feed / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb />
        <FeedCrumb active />
      </B.Breadcrumb>

      <h1>Feed</h1>

      {session
        ?
        <div className={styles.feedItems}>
          {_.orderBy(feedItems, ['createdAt'], ['desc'])
            .map(x => <FeedItemComponent key={x.id} item={x} />)
          }
        </div>
        :
        <>
          <p>
            Please <a href="#" onClick={async () => signIn()}>log in</a> to see your feed.
          </p>
        </>
      }
    </>
  )
}

ShowFeed.getInitialProps = getInitialProps
ShowFeed.preload = preload

export default ShowFeed
