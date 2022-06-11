import { Card } from '@prisma/client'
import axios from 'axios'
import { wocResponse } from 'lib/http'
import type { UpdateCardBody } from 'pages/api/cards/update'
import type { Comment_, CreateCommentBody } from 'pages/api/comments/create'
import type { DeleteCommentBody } from 'pages/api/comments/delete'

// TODO: move other api calls here. Except that we don't actually need to do that because we'd rather move to GraphQL instead.

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
