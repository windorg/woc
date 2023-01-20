import type { NextPage, NextPageContext } from 'next'
import Head from 'next/head'
import React, { useState } from 'react'
import { BoardsCrumb, UserCrumb } from '../components/breadcrumbs'
import { useSession } from 'next-auth/react'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import { SocialTags } from 'components/socialTags'
import { useCards } from '@lib/queries/cards'
import { graphql } from 'generated/graphql'
import { useMutation, useQuery } from '@apollo/client'
import { useRouter } from 'next/router'

const getUserDocument = graphql(`
  query getUser($userId: String!) {
    user(id: $userId) {
      id
      displayName
      handle
      followed
    }
  }
`)

const followUserDocument = graphql(`
  mutation followUser($userId: String!) {
    followUser(id: $userId) {
      id
      followed
    }
  }
`)

const unfollowUserDocument = graphql(`
  mutation unfollowUser($userId: String!) {
    unfollowUser(id: $userId) {
      id
      followed
    }
  }
`)

function FollowButton(props: { user }) {
  const [followUser, followUserMutation] = useMutation(followUserDocument, {
    variables: { userId: props.user.id },
  })
  const [unfollowUser, unfollowUserMutation] = useMutation(unfollowUserDocument, {
    variables: { userId: props.user.id },
  })
  return props.user.followed ? (
    <B.Button
      size="sm"
      variant="outline-secondary"
      disabled={unfollowUserMutation.loading}
      onClick={async () => unfollowUser()}
    >
      Unfollow
      {unfollowUserMutation.loading && (
        <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
      )}
    </B.Button>
  ) : (
    <B.Button
      size="sm"
      variant="outline-primary"
      disabled={followUserMutation.loading}
      onClick={async () => followUser()}
    >
      Follow
      {followUserMutation.loading && (
        <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
      )}
    </B.Button>
  )
}

const ShowUser: NextPage = () => {
  const userId = useRouter().query.userId as string
  const { data: session } = useSession()

  const userQuery = useQuery(getUserDocument, { variables: { userId } })
  const boardsQuery = useCards({ owners: [userId], onlyTopLevel: true })

  if (userQuery.error) return <B.Alert variant="danger">{userQuery.error.message}</B.Alert>
  if (!userQuery.data)
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )

  if (boardsQuery.status === 'loading' || boardsQuery.status === 'idle')
    return (
      <div className="d-flex mt-5 justify-content-center">
        <B.Spinner animation="border" />
      </div>
    )
  if (boardsQuery.status === 'error')
    return <B.Alert variant="danger">{(boardsQuery.error as Error).message}</B.Alert>

  const user = userQuery.data.user
  const boards = boardsQuery.data

  return (
    <>
      <Head>
        <title>
          {user.displayName} @{user.handle} / WOC
        </title>
      </Head>
      <SocialTags title={`${user.displayName} @${user.handle}`} />

      <B.Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={user} active />
      </B.Breadcrumb>

      <h1>
        <span className="me-3">{user.displayName}</span>
        <em>@{user.handle}</em>
        {/* TODO should show up even when the user isn't logged in */}
        {user.followed !== null && (
          <>
            <span className="ms-4" />
            <FollowButton user={user} />
          </>
        )}
      </h1>

      <BoardsList
        allowNewBoard={(session?.userId ?? null) === user.id}
        heading="Boards"
        boards={boards}
        kind="own-board"
      />
    </>
  )
}

export default ShowUser
