import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Comment } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb, FeedCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession } from 'next-auth/react'
import { canSeeComment } from '../lib/access'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import filterAsync from 'node-filter-async'
import _ from 'lodash'
import moment from 'moment'
import { FeedItem, FeedItemComponent } from 'components/feedItem'
import styles from './ShowFeed.module.scss'

type Props = {
  userId: User['id'] | null
  feedItems: FeedItem[]
}

// TODO allow switching between 3 and 14 days
export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  if (session) {
    // Logged in
    const followedUserIds = await prisma.followedUser.findMany({
      where: { subscriberId: session.userId },
      select: { followedUserId: true }
    }).then(xs => xs.map(x => x.followedUserId))
    const feedItems: FeedItem[] = await prisma.comment.findMany({
      where: {
        ownerId: { in: followedUserIds },
        createdAt: { gte: moment().subtract(3, 'days').toDate() }
      },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        card: { select: { title: true } }
      }
    }).then(xs => filterAsync(xs, x => canSeeComment(session.userId, x.id)))
      .then(xs => xs.map(x => ({ ...x, tag: 'comment' })))
    const props: Props = {
      userId: session.userId,
      feedItems
    }
    return {
      props: serialize(props)
    }
  } else {
    // Not logged in
    const props: Props = {
      userId: null,
      feedItems: []
    }
    return {
      props: serialize(props)
    }
  }
}

const ShowFeed: NextPage<SuperJSONResult> = (props) => {
  const { userId, feedItems } = deserialize<Props>(props)

  return (
    <>
      <Head>
        <title>Feed / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb />
        <FeedCrumb active />
      </Breadcrumb>

      <h1>Feed</h1>

      {userId
        ?
        <div className={styles.feedItems}>
          {_.orderBy(feedItems, ['createdAt'], ['desc'])
            .map(x => <FeedItemComponent key={x.id} item={x} />)
          }
        </div>
        :
        <>
          <p>
            Please <Link href="/LoginOrSignup"><a>log in</a></Link> to see your feed.
          </p>
        </>
      }
    </>
  )
}

export default ShowFeed
