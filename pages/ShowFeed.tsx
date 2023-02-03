import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React from 'react'
import * as B from 'react-bootstrap'
import { BoardsCrumb, FeedCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, useSession } from 'next-auth/react'
import _ from 'lodash'
import { FeedItemComponent } from 'components/feedItem'
import styles from './ShowFeed.module.scss'
import { signIn } from 'next-auth/react'
import { useFeed } from 'lib/queries/feed'

const ShowFeed: NextPage = () => {
  const { data: session } = useSession()

  const feedQuery = useFeed({ days: 3 })

  if (feedQuery.status === 'loading' || feedQuery.status === 'idle')
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )
  if (feedQuery.status === 'error')
    return <B.Alert variant="danger">{(feedQuery.error as Error).message}</B.Alert>

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

      {session ? (
        <div className={`${styles.feedItems} mb-5`}>
          {_.orderBy(feedItems, ['createdAt'], ['desc']).map((x) => (
            <FeedItemComponent key={x.id} item={x} />
          ))}
        </div>
      ) : (
        <>
          <p>
            Please{' '}
            <a href="#" onClick={async () => signIn()}>
              log in
            </a>{' '}
            to see your feed.
          </p>
        </>
      )}
    </>
  )
}

export default ShowFeed
