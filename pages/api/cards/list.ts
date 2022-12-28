import { Card, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { getSession } from 'next-auth/react'
import { canSeeCard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterAsync } from 'lib/array'
import { Result } from 'lib/http'

export type ListCardsQuery = {
  parents?: Card['id'][] // as a JSON array
  owners?: User['id'][] // as a JSON array
  onlyTopLevel?: boolean // if true, returns cards w/ parent === null
}

const schema: Schema<ListCardsQuery> = yup.object({
  parents: yup.array().json().of(yup.string().uuid().required()),
  owners: yup.array().json().of(yup.string().uuid().required()),
  onlyTopLevel: yup.boolean(),
})

export type ListCardsData = (Omit<Card, 'childrenOrder'> & { _count: { comments: number } })[]

export type ListCardsResponse = Result<ListCardsData, never>

// NB: Can return either cards or boards!
export async function serverListCards(session: Session | null, query: ListCardsQuery): Promise<ListCardsResponse> {
  const cards = await prisma.card
    .findMany({
      where: {
        ...(query.parents ? { parentId: { in: query.parents } } : {}),
        ...(query.owners ? { ownerId: { in: query.owners } } : {}),
        ...(query.onlyTopLevel ? { parentId: null } : {}),
      },
      include: {
        _count: { select: { comments: true } },
      },
    })
    .then(async (xs) => filterAsync(xs, async (card) => canSeeCard(session?.userId ?? null, card)))
  return {
    success: true,
    data: cards.map((card) => _.omit(card, 'childrenOrder')),
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
