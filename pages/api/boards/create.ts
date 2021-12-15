import { Board } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { BoardSettings } from 'lib/model-settings'

interface CreateBoardRequest extends NextApiRequest {
  body: {
    title: Board['title']
    private?: boolean
  }
}

export type CreateBoardBody = CreateBoardRequest['body']

const schema: SchemaOf<CreateBoardBody> = yup.object({
  title: yup.string().required(),
  private: yup.boolean()
})

export default async function createBoard(req: CreateBoardRequest, res: NextApiResponse<Board>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    // TODO all 403s etc must end with send() otherwise they aren't sent
    if (!session) return res.status(403)
    const settings: Partial<BoardSettings> = {
      visibility: body.private ? 'private' : 'public'
    }
    const board = await prisma.board.create({
      data: {
        title: body.title.trim(),
        settings,
        // TODO will this fail loudly if the user doesn't exist (but the session is still alive)?
        ownerId: session.userId
      }
    })
    return res.status(201).json(board)
  }
}

export async function callCreateBoard(body: CreateBoardBody): Promise<Board> {
  const { data } = await axios.post('/api/boards/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
