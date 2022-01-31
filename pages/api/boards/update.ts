import { Board, Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import { canEditBoard } from 'lib/access'
import { BoardSettings } from 'lib/model-settings'
import _ from 'lodash'

interface UpdateBoardRequest extends NextApiRequest {
  body: {
    boardId: Board['id']
    title?: Board['title']
    private?: boolean
  }
}

export type UpdateBoardBody = UpdateBoardRequest['body']

const schema: Schema<UpdateBoardBody> = yup.object({
  boardId: yup.string().uuid().required(),
  title: yup.string(),
  private: yup.boolean(),
})

// Returns only the updated fields (the 'settings' field is always returned in full)
//
// TODO here and in general we shouldn't return the complete 'settings' object because it might contain things we don't
// want to expose. Instead we should have a different view type for boards, with settings embedded.
export default async function updateBoard(req: UpdateBoardRequest, res: NextApiResponse<Partial<Board>>) {
  if (req.method === 'PUT') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const board = await prisma.board.findUnique({
      where: { id: body.boardId },
      rejectOnNotFound: true,
    })
    if (!canEditBoard(session?.userId ?? null, board)) return res.status(403)

    let diff: Partial<Board> & { settings: Partial<BoardSettings> } = {
      settings: board.settings ?? {}
    }
    if (body.title !== undefined) {
      diff.title = body.title
    }
    if (body.private !== undefined) {
      diff.settings.visibility = (body.private ? "private" : "public")
    }
    await prisma.board.update({
      where: { id: body.boardId },
      // See https://github.com/prisma/prisma/issues/9247
      data: (diff as unknown) as Prisma.InputJsonObject
    })
    // If we ever have "updatedAt", we should also return it here

    return res.status(200).json(diff)
  }
}

export async function callUpdateBoard(body: UpdateBoardBody): Promise<Partial<Board>> {
  const { data } = await axios.put('/api/boards/update', body)
  return wocResponse(data)
}
