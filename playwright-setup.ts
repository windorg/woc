import { prisma } from './lib/db'
import { chromium, FullConfig } from '@playwright/test'
import { createAndSaveUser } from './e2e/util'

// Clear the database
async function resetDatabase() {
  const [{ current_database }] = await prisma.$queryRaw<{ current_database: string }[]>`select current_database()`
  if (current_database !== 'db_dev') throw new Error(`Expected to connect to the dev database, got ${current_database}`)
  // NB: we can't use 'prisma migrate reset' because it will recreate enums and we'll end up with outdated type
  // references in the running server
  await prisma.subscriptionUpdate.deleteMany()
  await prisma.reply.deleteMany()
  await prisma.user.deleteMany()
  console.log('The database has been reset')
}

async function globalSetup(config: FullConfig) {
  await resetDatabase()
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL: config.projects[0].use.baseURL })
  await createAndSaveUser(page,
    { logout: true },
    {
      email: 'alice@woc.test',
      handle: 'alice',
      displayName: 'Alice T.'
    }
  )
  await createAndSaveUser(page,
    { logout: true },
    {
      email: 'bob@woc.test',
      handle: 'bob',
      displayName: 'Bob T.'
    }
  )
  await browser.close()
}

export default globalSetup