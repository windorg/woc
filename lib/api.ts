import { Card, Comment, Reply } from '@prisma/client'
import axios from 'axios'
import { ResponseError, wocQuery, wocResponse } from 'lib/http'
import type { UpdateCardBody } from 'pages/api/cards/update'
import type { Comment_, CreateCommentBody } from 'pages/api/comments/create'
import type { DeleteCommentBody } from 'pages/api/comments/delete'
import { CreateCardBody } from "../pages/api/cards/create"
import { SignupBody, SignupData, SignupResponse } from "../pages/api/auth/signup"
import { DeleteCardBody } from "../pages/api/cards/delete"
import { GetCardData, GetCardQuery, GetCardResponse } from "../pages/api/cards/get"
import { ListCardsData, ListCardsQuery, ListCardsResponse } from "../pages/api/cards/list"
import { MoveCardBody, MoveCardData, MoveCardResponse } from "../pages/api/cards/move"
import { ReorderCardsBody, ReorderCardsData, ReorderCardsResponse } from "../pages/api/cards/reorderCards"
import { ListCommentsData, ListCommentsQuery, ListCommentsResponse } from "../pages/api/comments/list"
import { UpdateCommentBody } from "../pages/api/comments/update"
import { GetFeedData, GetFeedQuery, GetFeedResponse } from "../pages/api/feed/get"
import { InboxCountResponse } from "../pages/api/inbox/count"
import { GetInboxData, GetInboxQuery, GetInboxResponse } from "../pages/api/inbox/get"
import { MarkAsReadBody, MarkAsReadData, MarkAsReadResponse } from "../pages/api/inbox/mark-as-read"
import { CreateReplyBody, ReplyResponse } from "../pages/api/replies/create"
import { DeleteReplyBody } from "../pages/api/replies/delete"
import { ListRepliesData, ListRepliesQuery, ListRepliesResponse } from "../pages/api/replies/list"
import { UpdateReplyBody } from "../pages/api/replies/update"
import { FollowUserBody } from "../pages/api/users/follow"
import { GetUserData, GetUserQuery, GetUserResponse } from "../pages/api/users/get"
import { UnfollowUserBody } from "../pages/api/users/unfollow"

export async function callUpdateCard(body: UpdateCardBody): Promise<Partial<Card>> {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/update`, body)
  return wocResponse(data)
}

export async function callCreateComment(body: CreateCommentBody): Promise<Comment_> {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/comments/create`, body)
  return wocResponse(data)
}

export async function callDeleteComment(body: DeleteCommentBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/comments/delete`, body)
}

export async function callCreateCard(body: CreateCardBody): Promise<Card & { parentId: string }> {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/create`, body)
  return wocResponse(data)
}

export async function callSignup(body: SignupBody): Promise<SignupData>
export async function callSignup(body: SignupBody, opts: { returnErrors: true }): Promise<SignupResponse>
export async function callSignup(body: SignupBody, opts?) {
  const { data: result } = await axios.post<SignupResponse>(`${process.env.NEXT_PUBLIC_APP_URL!}/api/auth/signup`, body)
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error) throw new ResponseError('Signup error', result.error)
}

export async function callDeleteCard(body: DeleteCardBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/delete`, body)
}

export async function callGetCard(query: GetCardQuery): Promise<GetCardData>
export async function callGetCard(query: GetCardQuery, opts: { returnErrors: true }): Promise<GetCardResponse>
export async function callGetCard(query: GetCardQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/get`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.notFound) throw new ResponseError('Card not found', result.error)
}

export async function callListCards(query: ListCardsQuery): Promise<ListCardsData>
export async function callListCards(query: ListCardsQuery, opts: { returnErrors: true }): Promise<ListCardsResponse>
export async function callListCards(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/list`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}

export async function callMoveCard(body: MoveCardBody): Promise<MoveCardData>
export async function callMoveCard(body: MoveCardBody, opts: { returnErrors: true }): Promise<MoveCardResponse>
export async function callMoveCard(body: MoveCardBody, opts?) {
  const { data: result } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/move`, body)
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
  if (result.error.notFound) throw new ResponseError('Not found', result.error)
  if (result.error.parentIntoChild) throw new ResponseError('Cannot move a card into its own child', result.error)
}

export async function callReorderCards(body: ReorderCardsBody): Promise<ReorderCardsData>
export async function callReorderCards(body: ReorderCardsBody, opts: { returnErrors: true }): Promise<ReorderCardsResponse>
export async function callReorderCards(body: ReorderCardsBody, opts?) {
  const { data: result } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/reorderCards`, body)
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
  if (result.error.notFound) throw new ResponseError('Not found', result.error)
}

export async function callListComments(query: ListCommentsQuery): Promise<ListCommentsData>
export async function callListComments(query: ListCommentsQuery, opts: { returnErrors: true }): Promise<ListCommentsResponse>
export async function callListComments(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/comments/list`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}

export async function callUpdateComment(body: UpdateCommentBody): Promise<Partial<Comment>> {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_APP_URL!}/api/comments/update`, body)
  return wocResponse(data)
}

export async function callGetFeed(query: GetFeedQuery): Promise<GetFeedData>
export async function callGetFeed(query: GetFeedQuery, opts: { returnErrors: true }): Promise<GetFeedResponse>
export async function callGetFeed(query: GetFeedQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/feed/get`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
}

export async function callInboxCount(): Promise<InboxCountResponse> {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/count`)
  return data
}

export async function callGetInbox(query: GetInboxQuery): Promise<GetInboxData>
export async function callGetInbox(query: GetInboxQuery, opts: { returnErrors: true }): Promise<GetInboxResponse>
export async function callGetInbox(query: GetInboxQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/get`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
}

export async function callMarkAsRead(body: MarkAsReadBody): Promise<MarkAsReadData>
export async function callMarkAsRead(body: MarkAsReadBody, opts: { returnErrors: true }): Promise<MarkAsReadResponse>
export async function callMarkAsRead(body: MarkAsReadBody, opts?) {
  const { data: result } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/mark-as-read`, body)
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.unauthorized) throw new ResponseError('Unauthorized', result.error)
  if (result.error.notFound) throw new ResponseError('Not found', result.error)
}

export async function callCreateReply(body: CreateReplyBody): Promise<ReplyResponse> {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/replies/create`, body)
  return wocResponse(data)
}

export async function callDeleteReply(body: DeleteReplyBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/replies/delete`, body)
}

export async function callListReplies(query: ListRepliesQuery): Promise<ListRepliesData>
export async function callListReplies(query: ListRepliesQuery, opts: { returnErrors: true }): Promise<ListRepliesResponse>
export async function callListReplies(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/replies/list`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}

export async function callUpdateReply(body: UpdateReplyBody): Promise<Partial<Reply>> {
  const { data } = await axios.put(`${process.env.NEXT_PUBLIC_APP_URL!}/api/replies/update`, body)
  return wocResponse(data)
}

export async function callFollowUser(body: FollowUserBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/users/follow`, body)
}

export async function callGetUser(query: GetUserQuery): Promise<GetUserData>
export async function callGetUser(query: GetUserQuery, opts: { returnErrors: true }): Promise<GetUserResponse>
export async function callGetUser(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/users/get`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.notFound) throw new ResponseError('User not found', result.error)
}

export async function callUnfollowUser(body: UnfollowUserBody): Promise<void> {
  await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/users/unfollow`, body)
}