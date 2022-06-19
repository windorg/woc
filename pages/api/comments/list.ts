import { Card, Comment, Prisma, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canEditComment, canSeeComment } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterAsync, filterSync, mapAsync } from 'lib/array'
import { Result, wocQuery, wocResponse } from 'lib/http'

export type ListCommentsQuery = {
  cards: Card['id'][] // as a JSON array
}

const schema: Schema<ListCommentsQuery> = yup.object({
  cards: yup.array().json().of(yup.string().uuid().required()).required()
})

export type ListCommentsData =
  (Comment & {
    canEdit: boolean
  })[]

export type ListCommentsResponse = Result<ListCommentsData, never>

export async function serverListComments(session: Session | null, query: ListCommentsQuery): Promise<ListCommentsResponse> {
  const comments = await prisma.comment.findMany({ where: { cardId: { in: query.cards } } })
    .then(async xs => filterAsync(xs, async (comment) => canSeeComment(session?.userId ?? null, comment)))
    .then(xs => xs.map(comment => ({
      ...comment,
      canEdit: canEditComment(session?.userId ?? null, comment)
    })))
  return {
    success: true,
    data: comments,
  }
}

export default async function apiListComments(req: NextApiRequest, res: NextApiResponse<ListCommentsResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverListComments(session, query)
    return res.status(200).json(response)
  }
}

export async function callListComments(query: ListCommentsQuery): Promise<ListCommentsData>
export async function callListComments(query: ListCommentsQuery, opts: { returnErrors: true }): Promise<ListCommentsResponse>
export async function callListComments(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/comments/list`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}
