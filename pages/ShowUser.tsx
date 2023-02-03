import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { BoardsCrumb, UserCrumb } from '../components/breadcrumbs'
import { useSession } from 'next-auth/react'
import _ from 'lodash'
import { BoardsList } from 'components/boardsList'
import * as B from 'react-bootstrap'
import { SocialTags } from 'components/socialTags'
import { graphql } from 'generated/graphql'
import { useMutation, useQuery } from '@apollo/client'
import { useRouter } from 'next/router'
import { Query } from '@components/query'

const _followUser = graphql(`
  mutation followUser($userId: UUID!) {
    followUser(id: $userId) {
      id
      followed
    }
  }
`)

const _unfollowUser = graphql(`
  mutation unfollowUser($userId: UUID!) {
    unfollowUser(id: $userId) {
      id
      followed
    }
  }
`)

function FollowButton(props: { user }) {
  const [followUser, followUserMutation] = useMutation(_followUser, {
    variables: { userId: props.user.id },
  })
  const [unfollowUser, unfollowUserMutation] = useMutation(_unfollowUser, {
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

const useGetUser = (variables: { userId: string }) => {
  return useQuery(
    graphql(`
      query getUser($userId: UUID!) {
        user(id: $userId) {
          id
          displayName
          handle
          followed
          topLevelCards {
            id
            createdAt
            title
            ownerId
            visibility
          }
        }
      }
    `),
    { variables }
  )
}

const ShowUser: NextPage = () => {
  const userId = useRouter().query.userId as string
  const { data: session } = useSession()

  const userQuery = useGetUser({ userId })

  return (
    <>
      <Query queries={{ userQuery }}>
        {({ userQuery: { user } }) => (
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
              boards={user.topLevelCards}
              kind="own-board"
            />
          </>
        )}
      </Query>
    </>
  )
}

export default ShowUser
