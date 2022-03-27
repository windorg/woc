import { User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import _ from 'lodash'

interface FollowUserRequest extends NextApiRequest {
  body: {
    userId: User['id']
  }
}

export type FollowUserBody = FollowUserRequest['body']

const schema: Schema<FollowUserBody> = yup.object({
  userId: yup.string().uuid().required(),
})

export default async function followUser(req: FollowUserRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    if (!session) return res.status(403)

    // Apparently Prisma doesn't have "exists": https://github.com/prisma/prisma/issues/5022
    const follows: boolean = await prisma.followedUser.count({
      where: {
        subscriberId: session.userId,
        followedUserId: body.userId,
      }
    }).then(Boolean)

    if (!follows) {
      await prisma.followedUser.create({
        data: {
          subscriberId: session.userId,
          followedUserId: body.userId,
        }
      })
    }

    return res.status(200).send()
  }
}

export async function callFollowUser(body: FollowUserBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/users/follow`, body)
}
