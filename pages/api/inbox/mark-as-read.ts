import {SubscriptionUpdate} from '@prisma/client'
import {NextApiRequest, NextApiResponse} from 'next'
import {prisma} from '../../../lib/db'
import * as yup from 'yup'
import {Schema} from 'yup'
import {Result} from 'lib/http'
import {getSession} from 'next-auth/react'
import {Session} from 'next-auth'

export type MarkAsReadBody = {
  subscriptionUpdateId: SubscriptionUpdate['id']
}

const schema: Schema<MarkAsReadBody> = yup.object({
  subscriptionUpdateId: yup.string().uuid().required(),
})

export type MarkAsReadData = Record<string, never>

export type MarkAsReadResponse = Result<MarkAsReadData, { unauthorized: true } | { notFound: true }>

export async function serverMarkAsRead(session: Session | null, body: MarkAsReadBody): Promise<MarkAsReadResponse> {
  if (!session) return { success: false, error: { unauthorized: true } }
  const subscriptionUpdate = await prisma.subscriptionUpdate.findUnique({ where: { id: body.subscriptionUpdateId } })
  if (!subscriptionUpdate) return { success: false, error: { notFound: true } }
  if (subscriptionUpdate.subscriberId !== session.userId) return { success: false, error: { unauthorized: true } }
  await prisma.subscriptionUpdate.update({
    where: { id: body.subscriptionUpdateId },
    data: { isRead: true },
  })
  return { success: true, data: {} }
}

export default async function apiMarkAsRead(req: NextApiRequest, res: NextApiResponse<MarkAsReadResponse>) {
  if (req.method === 'POST') {
    const session = await getSession({ req })
    const body = schema.cast(req.body)
    const response = await serverMarkAsRead(session, body)
    return res.status(200).json(response)
  }
}

