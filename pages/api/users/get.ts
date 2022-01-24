import { Board, Card, Prisma, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import _ from 'lodash'
import { Session } from 'next-auth'

interface GetUserRequest extends NextApiRequest {
  query: {
    userId: User['id']
  }
}

export type GetUserQuery = GetUserRequest['query']

const schema: SchemaOf<GetUserQuery> = yup.object({
  userId: yup.string().uuid().required(),
})

export type GetUserResponse =
  | {
    success: true,
    data: Pick<User, 'id' | 'handle' | 'displayName'>
  }
  | {
    success: false,
    error: { notFound: true }
  }

// NB: Assumes that the query is already validated
export async function serverGetUser(session: Session | null, query: GetUserQuery): Promise<GetUserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: query.userId },
    select: { id: true, handle: true, displayName: true }
  })
  if (!user) return {
    success: false,
    error: { notFound: true }
  }
  return {
    success: true,
    data: user,
  }
}

export default async function apiGetUser(req: GetUserRequest, res: NextApiResponse<GetUserResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = await schema.validate(req.query)
    const response = await serverGetUser(session, query)
    return res.status(200).json(response)
  }
}

export async function callGetUser(query: GetUserQuery): Promise<GetUserResponse> {
  const { data } = await axios.get('/api/users/get', { params: query })
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
