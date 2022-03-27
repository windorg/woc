import { Board, Card, Prisma, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { ResponseError, Result, wocQuery, wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditBoard, CanSee, canSeeBoard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterSync } from 'lib/array'

export type GetBoardQuery = {
  boardId: Board['id']
}

const schema: Schema<GetBoardQuery> = yup.object({
  boardId: yup.string().uuid().required(),
})

export type GetBoardData = CanSee & Board & {
  owner: Pick<User, 'id' | 'handle'>
  canEdit: boolean
}

export type GetBoardResponse = Result<GetBoardData, { notFound: true }>

export async function serverGetBoard(session: Session | null, query: GetBoardQuery): Promise<GetBoardResponse> {
  const board = await prisma.board.findUnique({
    where: { id: query.boardId },
    include: {
      owner: { select: { id: true, handle: true } },
    }
  }).then(async board => board
    ? {
      ...board,
      canEdit: canEditBoard(session?.userId ?? null, board)
    }
    : null
  )
  if (!board || !canSeeBoard(session?.userId ?? null, board)) return {
    success: false,
    error: { notFound: true }
  }
  return {
    success: true,
    data: board,
  }
}

export default async function apiGetBoard(req: NextApiRequest, res: NextApiResponse<GetBoardResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverGetBoard(session, query)
    return res.status(200).json(response)
  }
}

export async function callGetBoard(query: GetBoardQuery): Promise<GetBoardData>
export async function callGetBoard(query: GetBoardQuery, opts: { returnErrors: true }): Promise<GetBoardResponse>
export async function callGetBoard(query: GetBoardQuery, opts?) {
  const { data: result } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/boards/get`, { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
  if (result.error.notFound) throw new ResponseError('Board not found', result.error)
}
