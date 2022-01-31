import { Board } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import { canEditBoard } from 'lib/access'

interface DeleteBoardRequest extends NextApiRequest {
  body: {
    boardId: Board['id']
  }
}

export type DeleteBoardBody = DeleteBoardRequest['body']

const schema: Schema<DeleteBoardBody> = yup.object({
  boardId: yup.string().uuid().required()
})

export default async function deleteBoard(req: DeleteBoardRequest, res: NextApiResponse<void>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const board = await prisma.board.findUnique({
      where: { id: body.boardId },
      rejectOnNotFound: true,
    })
    if (!canEditBoard(session?.userId ?? null, board)) return res.status(403)

    await prisma.board.delete({
      where: { id: body.boardId }
    })

    return res.status(204).send()
  }
}

export async function callDeleteBoard(body: DeleteBoardBody): Promise<void> {
  await axios.post('/api/boards/delete', body)
}
