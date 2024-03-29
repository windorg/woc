import { Card, Comment, Reply, User } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { Schema } from 'yup'
import { ResponseError, Result, wocQuery, wocResponse } from 'lib/http'
import { getSession } from 'next-auth/react'
import _ from 'lodash'
import { Session } from 'next-auth'
import { UserSettings } from 'lib/model-settings'
import { boardsRoute } from 'lib/routes'

// https://api.beeminder.com/#client-oauth
//
// This is the endpoint that Beeminder will redirect to after the user has authorized WOC.

export type BeeminderAuthCallbackQuery = {
  access_token: string
  username: string
}

const schema: Schema<BeeminderAuthCallbackQuery> = yup.object({
  access_token: yup.string().required(),
  username: yup.string().required(),
})

export type BeeminderAuthCallbackData = Record<string, never>

export type BeeminderAuthCallbackResponse = Result<BeeminderAuthCallbackData, { unauthorized: true }>

export async function serverBeeminderAuthCallback(
  session: Session | null,
  query: BeeminderAuthCallbackQuery
): Promise<BeeminderAuthCallbackResponse> {
  if (!session) return { success: false, error: { unauthorized: true } }
  await prisma.$transaction(async (prisma) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { settings: true },
    })
    const newSettings = (user.settings as Partial<UserSettings>) || {}
    newSettings.beeminderUsername = query.username
    newSettings.beeminderAccessToken = query.access_token
    await prisma.user.update({
      where: { id: session.userId },
      data: { settings: newSettings },
    })
  })
  return { success: true, data: {} }
}

export default async function apiBeeminderAuthCallback(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    const query = schema.cast(req.query)
    const response = await serverBeeminderAuthCallback(session, query)
    if (response.success) {
      return res.redirect(boardsRoute())
    } else {
      return res.status(401).send('Unauthorized')
    }
  }
}
