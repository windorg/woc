import { Card, CardType, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canSeeCard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterAsync, filterSync, mapAsync } from 'lib/array'
import { Result, wocQuery, wocResponse } from 'lib/http'

export type ListCardsQuery = {
  boards: Card['id'][] // as a JSON array
}

const schema: Schema<ListCardsQuery> = yup.object({
  boards: yup.array().json().of(yup.string().uuid().required()).required()
})

export type ListCardsData =
  (Card & { _count: { comments: number } })[]

export type ListCardsResponse = Result<ListCardsData, never>

export async function serverListCards(session: Session | null, query: ListCardsQuery): Promise<ListCardsResponse> {
  const cards = await prisma.card.findMany({
    where: { type: CardType.Card, parentId: { in: query.boards } },
    include: {
      _count: { select: { comments: true } }
    }
  })
    .then(async xs => filterAsync(xs, async (card) => canSeeCard(session?.userId ?? null, card)))
  return {
    success: true,
    data: cards,
  }
}

export default async function apiListCards(req: NextApiRequest, res: NextApiResponse<ListCardsResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverListCards(session, query)
    return res.status(200).json(response)
  }
}

export async function callListCards(query: ListCardsQuery): Promise<ListCardsData>
export async function callListCards(query: ListCardsQuery, opts: { returnErrors: true }): Promise<ListCardsResponse>
export async function callListCards(query, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/cards/list`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}
