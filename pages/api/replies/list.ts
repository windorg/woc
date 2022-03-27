import { Board, Card, Reply, Prisma, Comment, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canDeleteReply, canEditReply, CanSee, canSeeReply, pCommentSelect } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterSync, mapAsync } from 'lib/array'
import { Result, wocQuery, wocResponse } from 'lib/http'

export type ListRepliesQuery = {
  // List all replies for one or several cards
  cards: Card['id'][]
}

const schema: Schema<ListRepliesQuery> = yup.object({
  cards: yup.array().json().of(yup.string().uuid().required()).required()
})

export type ListRepliesData =
  (CanSee & Reply & {
    // The author can be 'null' if it was deleted. We don't delete replies if the author's account is gone.
    author: Pick<User, 'id' | 'handle' | 'email' | 'displayName'> | null
    canEdit: boolean
    canDelete: boolean
    comment: Pick<Comment, 'cardId'>
  })[]

export type ListRepliesResponse = Result<ListRepliesData, never>

export async function serverListReplies(session: Session | null, query: ListRepliesQuery): Promise<ListRepliesResponse> {
  const where: Prisma.ReplyWhereInput = {}
  where.comment = { cardId: { in: query.cards } }
  const replies = await prisma.reply.findMany({
    where,
    include: {
      comment: { select: { ...pCommentSelect, cardId: true } },
      author: { select: { id: true, handle: true, email: true, displayName: true } }
    }
  })
    .then(xs => filterSync(xs, (reply): reply is typeof reply & CanSee => canSeeReply(session?.userId ?? null, reply)))
    .then(xs => xs.map(reply => ({
      ...(_.omit(reply, 'comment')),
      comment: { cardId: reply.comment.cardId },
      canEdit: canEditReply(session?.userId ?? null, reply),
      canDelete: canDeleteReply(session?.userId ?? null, reply)
    })))
  return {
    success: true,
    data: replies,
  }
}

export default async function apiListReplies(req: NextApiRequest, res: NextApiResponse<ListRepliesResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverListReplies(session, query)
    return res.status(200).json(response)
  }
}

export async function callListReplies(query: ListRepliesQuery): Promise<ListRepliesData>
export async function callListReplies(query: ListRepliesQuery, opts: { returnErrors: true }): Promise<ListRepliesResponse>
export async function callListReplies(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/replies/list`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}
