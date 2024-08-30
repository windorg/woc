// There is no way to get Next.js to run something at server startup (without using a custom server), so instead we call
// /api/health on server start (see server.js). It a) does the actual healthcheck and b) makes sure to init the things
// we want to init.

import { NextApiResponse } from 'next'
import { startJobQueueProcessing } from '@lib/job-queue'

let initCalled = false

export default async function handler(req, res: NextApiResponse) {
  if (!initCalled) {
    initCalled = true
    // await startJobQueueProcessing()
  }
  res.send('OK')
}
