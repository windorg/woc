import { User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import _ from 'lodash'

interface UnfollowUserRequest extends NextApiRequest {
  body: {
    userId: User['id']
  }
}

export type UnfollowUserBody = UnfollowUserRequest['body']

const schema: Schema<UnfollowUserBody> = yup.object({
  userId: yup.string().uuid().required(),
})

export default async function unfollowUser(req: UnfollowUserRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    if (!session) return res.status(403)

    await prisma.followedUser.deleteMany({
      where: {
        subscriberId: session.userId,
        followedUserId: body.userId,
      }
    })

    return res.status(200).send()
  }
}

export async function callUnfollowUser(body: UnfollowUserBody): Promise<void> {
  await axios.post('/api/users/unfollow', body)
}
