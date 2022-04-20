import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { getSession } from 'next-auth/react'
import _ from 'lodash'
import { getInboxItemsCount } from 'lib/inbox'

export type InboxCountResponse = {
  itemCount: number
}

export default async function apiInboxCount(req: NextApiRequest, res: NextApiResponse<InboxCountResponse>) {
  if (req.method === 'GET') {
    const session = await getSession({ req })
    // TODO all 403s etc must end with send() otherwise they aren't sent
    if (!session) return res.status(403)
    return res.status(200).json({
      itemCount: await getInboxItemsCount(session.userId)
    })
  }
}

export async function callInboxCount(): Promise<InboxCountResponse> {
  const { data } = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL!}/api/inbox/count`)
  return data
}
