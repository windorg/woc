import { Board, User } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { BoardSettings } from 'lib/model-settings'
import { wocResponse } from 'lib/http'

interface CreateBoardRequest extends NextApiRequest {
  body: {
    title: Board['title']
    private?: boolean
  }
}

export type CreateBoardBody = CreateBoardRequest['body']

const schema: Schema<CreateBoardBody> = yup.object({
  title: yup.string().required(),
  private: yup.boolean()
})

export type Board_ = Board & { owner: Pick<User, 'handle' | 'displayName'> }

export default async function createBoard(req: CreateBoardRequest, res: NextApiResponse<Board_>) {
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
        ownerId: session.userId,
        cardOrder: [],
      },
      include: {
        owner: { select: { handle: true, displayName: true } }
      }
    })
    return res.status(201).json(board)
  }
}

export async function callCreateBoard(body: CreateBoardBody): Promise<Board_> {
  const { data } = await axios.post(`${process.env.NEXT_PUBLIC_APP_URL!}/api/boards/create`, body)
  return wocResponse(data)
}
