import { Card, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { Result } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditCard, canSeeCard } from 'lib/access'
import { Session } from 'next-auth'
import { getCardChain } from '@lib/parents'

export type GetCardQuery = {
  cardId: Card['id']
}

const schema: Schema<GetCardQuery> = yup.object({
  cardId: yup.string().uuid().required(),
})

export type GetCardData = Card & {
  owner: Pick<User, 'id' | 'handle' | 'displayName'>
  parentChain: Card['id'][] // IDs of all cards in the parent chain (first == toplevel), will be [] if parentId === null
  canEdit: boolean
}

export type GetCardResponse = Result<GetCardData, { notFound: true }>

// NB: works for boards as well
export async function serverGetCard(session: Session | null, query: GetCardQuery): Promise<GetCardResponse> {
  const card = await prisma.card.findUnique({
    where: { id: query.cardId },
    include: {
      owner: { select: { id: true, handle: true, displayName: true } },
    },
  })
  if (!card || !(await canSeeCard(session?.userId ?? null, card)))
    return {
      success: false,
      error: { notFound: true },
    }
  const parentChain = card.parentId
    ? await prisma.$transaction(async (prisma) => getCardChain(prisma, card.parentId!))
    : []
  return {
    success: true,
    data: {
      ...card,
      canEdit: canEditCard(session?.userId ?? null, card),
      parentChain,
    },
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
