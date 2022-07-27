import {Card, Comment} from '@prisma/client'
import {NextApiRequest, NextApiResponse} from 'next'
import {prisma} from 'lib/db'
import * as yup from 'yup'
import {Schema} from 'yup'
import {getSession} from 'next-auth/react'
import {canEditComment, canSeeComment} from 'lib/access'
import {Session} from 'next-auth'
import {filterAsync} from 'lib/array'
import {Result} from 'lib/http'

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

