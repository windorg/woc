import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
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
      itemCount: await getInboxItemsCount(session.userId),
    })
  }
}
