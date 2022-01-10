import { Board, Card, Prisma, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { canEditBoard, canSeeBoard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'

interface GetBoardRequest extends NextApiRequest {
  query: {
    boardId: Board['id']
  }
}

export type GetBoardQuery = GetBoardRequest['query']

const schema: SchemaOf<GetBoardQuery> = yup.object({
  boardId: yup.string().uuid().required(),
})

export type GetBoardResponse = Board & {
  owner: Pick<User, 'id' | 'handle'>
  cards: (Card & { _count: { comments: number } })[]
  canEdit: boolean
}

// NB: Assumes that the query is already validated
export async function serverGetBoard(session: Session | null, query: GetBoardQuery): Promise<GetBoardResponse | null> {
  const board = await prisma.board.findUnique({
    where: { id: query.boardId },
    include: {
      owner: { select: { id: true, handle: true } },
      cards: {
        include: {
          _count: { select: { comments: true } }
        }
      }
    }
  })
  if (!board || !(await canSeeBoard(session?.userId, board))) return null
  return { ...board, canEdit: await canEditBoard(session?.userId, board) }
}

export default async function apiGetBoard(req: GetBoardRequest, res: NextApiResponse<GetBoardResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = await schema.validate(req.query)
    const response = await serverGetBoard(session, query)
    if (!response) return res.status(404).send(null as unknown as GetBoardResponse)
    return res.status(200).json(response)
  }
}

export async function callGetBoard(query: GetBoardQuery): Promise<GetBoardResponse | null> {
  const { data, status } = await axios.get('/api/boards/get', {
    params: query,
    validateStatus: status => (status < 400 || status === 404)
  })
  if (status === 200)
    return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
  else
    return null
}
