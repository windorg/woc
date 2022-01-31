import { Board, Card, Prisma, Reply, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { ResponseError, Result, wocQuery, wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditBoard, canEditCard, CanSee, canSeeBoard, canSeeCard, PCard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'

export type GetCardQuery = {
  cardId: Card['id']
}

const schema: Schema<GetCardQuery> = yup.object({
  cardId: yup.string().uuid().required(),
})

export type GetCardData =
  CanSee & Card & {
    owner: Pick<User, 'id' | 'handle' | 'displayName'>
    board: Pick<Board, 'id' | 'ownerId' | 'settings' | 'title'>
    canEdit: boolean
  }

export type GetCardResponse = Result<GetCardData, { notFound: true }>

export async function serverGetCard(session: Session | null, query: GetCardQuery): Promise<GetCardResponse> {
  const card = await prisma.card.findUnique({
    where: { id: query.cardId },
    include: {
      owner: { select: { id: true, handle: true, displayName: true } },
      board: { select: { id: true, ownerId: true, settings: true, title: true } }
    }
  }).then(async card => card
    ? {
      ...card,
      canEdit: canEditCard(session?.userId ?? null, card)
    }
    : null
  )
  if (!card || !canSeeCard(session?.userId ?? null, card)) return {
    success: false,
    error: { notFound: true }
  }
  return {
    success: true,
    data: card,
  }
}

export default async function apiGetCard(req: NextApiRequest, res: NextApiResponse<GetCardResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverGetCard(session, query)
    return res.status(200).json(response)
  }
}

export async function callGetCard(query: GetCardQuery): Promise<GetCardData>
export async function callGetCard(query: GetCardQuery, opts: { returnErrors: true }): Promise<GetCardResponse>
export async function callGetCard(query: GetCardQuery, opts?) {
  const { data: result } = await axios.get('/api/cards/get', { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.notFound) throw new ResponseError('Card not found', result.error)
}
