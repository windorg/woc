import { User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { Result } from 'lib/http'
import { getSession } from 'next-auth/react'
import { Session } from 'next-auth'

export type GetUserQuery = {
  userId: User['id']
}

const schema: Schema<GetUserQuery> = yup.object({
  userId: yup.string().uuid().required(),
})

export type GetUserData = Pick<User, 'id' | 'handle' | 'displayName'> & {
  // Whether the currently logged-in user is following the queried user. Will be 'null' if there is no currently logged-in user.
  followed: boolean | null
  // Settings, but they will only be returned if the user is requesting the info about themselves.
  settings?: User['settings']
}

export type GetUserResponse = Result<GetUserData, { notFound: true }>

export async function serverGetUser(session: Session | null, query: GetUserQuery): Promise<GetUserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: query.userId },
    select: {
      id: true,
      handle: true,
      displayName: true,
      settings: (session?.userId ?? null) === query.userId,
    },
  })
  if (!user)
    return {
      success: false,
      error: { notFound: true },
    }
  const followed: boolean | null = session
    ? await prisma.followedUser
        .count({
          where: {
            subscriberId: session.userId,
            followedUserId: user.id,
          },
        })
        .then(Boolean)
    : null
  return {
    success: true,
    data: { ...user, followed },
  }
}

export default async function apiGetUser(req: NextApiRequest, res: NextApiResponse<GetUserResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverGetUser(session, query)
    return res.status(200).json(response)
  }
}
