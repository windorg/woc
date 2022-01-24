import { Board, Card, Prisma, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { canEditBoard, CanSee, canSeeBoard, canSeeCard, PCard } from 'lib/access'
import _ from 'lodash'
import { Session } from 'next-auth'
import { filterSync } from 'lib/array'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ListBoardsRequest extends NextApiRequest {
}

// export type GetBoardQuery = GetKKBoardRequest['query']

// const schema: SchemaOf<GetBoardQuery> = yup.object({
//   boardId: yup.string().uuid().required(),
// })

export type ListBoardsResponse =
  | {
    success: true,
    data: (CanSee & Board & {
      owner: Pick<User, 'handle' | 'displayName'>
    })[]
  }
// | {
//   success: false,
//   error: { notFound: true }
// }

export async function serverListBoards(session: Session | null): Promise<ListBoardsResponse> {
  const include = { owner: { select: { handle: true, displayName: true } } }
  const boards = await prisma.board.findMany({
    include
  }).then(xs => filterSync(xs, (board): board is typeof board & CanSee => canSeeBoard(session?.userId ?? null, board)))
  return {
    success: true,
    data: boards,
  }
}

export default async function apiListBoards(req: ListBoardsRequest, res: NextApiResponse<ListBoardsResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    // const query = await schema.validate(req.query)
    const response = await serverListBoards(session)
    return res.status(200).json(response)
  }
}

export async function callListBoards(): Promise<ListBoardsResponse> {
  const { data } = await axios.get('/api/boards/list')
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
