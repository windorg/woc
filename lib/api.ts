import axios from 'axios'
import { ResponseError, wocQuery, wocResponse } from 'lib/http'
import { SignupBody, SignupData, SignupResponse } from '../pages/api/auth/signup'
import { GetFeedData, GetFeedQuery, GetFeedResponse } from '../pages/api/feed/get'
import { InboxCountResponse } from '../pages/api/inbox/count'
import { GetInboxData, GetInboxQuery, GetInboxResponse } from '../pages/api/inbox/get'
import { MarkAsReadBody, MarkAsReadData, MarkAsReadResponse } from '../pages/api/inbox/mark-as-read'

export async function callSignup(body: SignupBody): Promise<SignupData>
export async function callSignup(
  body: SignupBody,
  opts: { returnErrors: true }
): Promise<SignupResponse>
export async function callSignup(body: SignupBody, opts?) {
  const { data: result } = await axios.post<SignupResponse>(
    `${process.env.NEXT_PUBLIC_APP_URL!}/api/auth/signup`,
    body
  )
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error) throw new ResponseError('Signup error', result.error)
}

export async function callGetFeed(query: GetFeedQuery): Promise<GetFeedData>
export async function callGetFeed(
  query: GetFeedQuery,
  opts: { returnErrors: true }
): Promise<GetFeedResponse>
export async function callGetFeed(query: GetFeedQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/feed/get`, {
    params: wocQuery(query),
  })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
}

export async function callInboxCount(): Promise<InboxCountResponse> {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/count`)
  return data
}

export async function callGetInbox(query: GetInboxQuery): Promise<GetInboxData>
export async function callGetInbox(
  query: GetInboxQuery,
  opts: { returnErrors: true }
): Promise<GetInboxResponse>
export async function callGetInbox(query: GetInboxQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/get`, {
    params: wocQuery(query),
  })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
}

export async function callMarkAsRead(body: MarkAsReadBody): Promise<MarkAsReadData>
export async function callMarkAsRead(
  body: MarkAsReadBody,
  opts: { returnErrors: true }
): Promise<MarkAsReadResponse>
export async function callMarkAsRead(body: MarkAsReadBody, opts?) {
  const { data: result } = await axios.post(
    `${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/mark-as-read`,
    body
  )
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
  if (result.error.notFound) throw new ResponseError('Not found', result.error)
}
