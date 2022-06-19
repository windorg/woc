import { NextApiRequest, NextApiResponse } from 'next'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { ResponseError, Result, wocQuery, wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import _ from 'lodash'
import { Session } from 'next-auth'
import { getInboxItems, InboxItem } from 'lib/inbox'

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

export async function callGetInbox(query: GetInboxQuery): Promise<GetInboxData>
export async function callGetInbox(query: GetInboxQuery, opts: { returnErrors: true }): Promise<GetInboxResponse>
export async function callGetInbox(query: GetInboxQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/get`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
}
