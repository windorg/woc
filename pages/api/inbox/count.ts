import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import _ from 'lodash'
import { getInboxItemsCount } from 'lib/inbox'

export type CountInbox = {
  itemCount: number
}

export default async function countInbox(req: NextApiRequest, res: NextApiResponse<CountInbox>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    // TODO all 403s etc must end with send() otherwise they aren't sent
    if (!session) return res.status(403)
    return res.status(200).json({
      itemCount: await getInboxItemsCount(session.userId)
    })
  }
}

export async function callCountInbox(): Promise<CountInbox> {
  const { data } = await axios.get('/api/inbox/count')
  return data
}
