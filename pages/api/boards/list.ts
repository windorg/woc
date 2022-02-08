import { Board, Card, Prisma, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from 'lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canEditBoard, CanSee, canSeeBoard, canSeeCard, PCard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterSync } from 'lib/array'
import { Result, wocQuery, wocResponse } from 'lib/http'

export type ListBoardsQuery = {
  // A list of users whose boards should be returned. If empty, will return all available boards.
  users?: User['id'][]
}

// TODO: get rid of interface extensions everywhere and use yup.cast instead of yup.validate

const schema: Schema<ListBoardsQuery> = yup.object({
  users: yup.array().json().of(yup.string().uuid().required())
})

export type ListBoardsData =
  (CanSee & Board & {
    owner: Pick<User, 'handle' | 'displayName'>
  })[]

export type ListBoardsResponse = Result<ListBoardsData, never>

export async function serverListBoards(session: Session | null, query: ListBoardsQuery): Promise<ListBoardsResponse> {
  const include = { owner: { select: { handle: true, displayName: true } } }
  const where: Prisma.BoardWhereInput = {}
  if (query?.users !== undefined) where.ownerId = { in: query.users }
  const boards = await prisma.board.findMany({
    include,
    ...(_.isEmpty(where) ? {} : { where })
  }).then(xs => filterSync(xs, (board): board is typeof board & CanSee => canSeeBoard(session?.userId ?? null, board)))
  return {
    success: true,
    data: boards,
  }
}

export default async function apiListBoards(req: NextApiRequest, res: NextApiResponse<ListBoardsResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverListBoards(session, query)
    return res.status(200).json(response)
  }
}

export async function callListBoards(query: ListBoardsQuery): Promise<ListBoardsData>
export async function callListBoards(query: ListBoardsQuery, opts: { returnErrors: true }): Promise<ListBoardsResponse>
export async function callListBoards(query, opts?) {
  const { data: result } = await axios.get('/api/boards/list', { params: wocQuery(query) })
  if (opts?.returnErrors) return wocResponse(result)
  if (result.success) return wocResponse(result.data)
}
