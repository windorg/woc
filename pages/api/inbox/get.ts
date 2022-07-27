import {NextApiRequest, NextApiResponse} from 'next'
import * as yup from 'yup'
import {Schema} from 'yup'
import {Result} from 'lib/http'
import {getSession} from 'next-auth/react'
import {Session} from 'next-auth'
import {getInboxItems, InboxItem} from 'lib/inbox'

export type GetInboxQuery = Record<string, never>

const schema: Schema<GetInboxQuery> = yup.object({})

export type GetInboxData = InboxItem[]

export type GetInboxResponse = Result<GetInboxData, { unauthorized: true }>

export async function serverGetInbox(session: Session | null, query: GetInboxQuery): Promise<GetInboxResponse> {
  if (!session) return { success: false, error: { unauthorized: true } }
  const inboxItems = await getInboxItems(session.userId)
  return { success: true, data: inboxItems }
}

export default async function apiGetInbox(req: NextApiRequest, res: NextApiResponse<GetInboxResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverGetInbox(session, query)
    return res.status(200).json(response)
  }
}

