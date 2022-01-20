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

export type GetBoardResponse =
  | {
    success: true,
    data: Board & {
      owner: Pick<User, 'id' | 'handle'>
      cards: (Card & { _count: { comments: number } })[]
      canEdit: boolean
    }
  }
  | {
    success: false,
    error: { notFound: true }
  }

// NB: Assumes that the query is already validated
export async function serverGetBoard(session: Session | null, query: GetBoardQuery): Promise<GetBoardResponse> {
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
  if (!board || !(await canSeeBoard(session?.userId, board))) return {
    success: false,
    error: { notFound: true }
  }
  return {
    success: true,
    data: { ...board, canEdit: await canEditBoard(session?.userId, board) }
  }
}

export default async function apiGetBoard(req: GetBoardRequest, res: NextApiResponse<GetBoardResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = await schema.validate(req.query)
    const response = await serverGetBoard(session, query)
    return res.status(200).json(response)
  }
}

export async function callGetBoard(query: GetBoardQuery): Promise<GetBoardResponse> {
  const { data } = await axios.get('/api/boards/get', { params: query })
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
