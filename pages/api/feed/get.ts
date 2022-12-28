import { Card, Comment, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { Result } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canSeeComment } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import moment from 'moment'
import { filterAsync } from 'lib/array'

export type GetFeedQuery = {
  days: number
}

const schema: Schema<GetFeedQuery> = yup.object({
  days: yup.number().integer().min(1).max(31).required(),
})

export type FeedItemComment = Comment & {
  owner: Pick<User, 'id' | 'email' | 'displayName'>
  card: Pick<Card, 'title'>
}

export type FeedItem = { tag: 'comment' } & FeedItemComment

export type GetFeedData = FeedItem[]

export type GetFeedResponse = Result<GetFeedData, { unauthorized: true }>

export async function serverGetFeed(session: Session | null, query: GetFeedQuery): Promise<GetFeedResponse> {
  if (!session) return { success: false, error: { unauthorized: true } }
  const followedUserIds = await prisma.followedUser
    .findMany({
      where: { subscriberId: session.userId },
      select: { followedUserId: true },
    })
    .then((xs) => xs.map((x) => x.followedUserId))
  const feedItems: FeedItem[] = await prisma.comment
    .findMany({
      where: {
        ownerId: { in: followedUserIds },
        createdAt: { gte: moment().subtract(query.days, 'days').toDate() },
      },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        card: { select: { title: true } },
      },
    })
    .then(async (xs) => filterAsync(xs, async (comment) => canSeeComment(session.userId, comment)))
    .then((xs) => xs.map((comment) => ({ ...comment, card: _.pick(comment.card, ['title']) })))
    .then((xs) => xs.map((x) => ({ ...x, tag: 'comment' })))
  return { success: true, data: feedItems }
}

export default async function apiGetFeed(req: NextApiRequest, res: NextApiResponse<GetFeedResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverGetFeed(session, query)
    return res.status(200).json(response)
  }
}
