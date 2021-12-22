import { prisma } from './lib/db'
import { Browser, chromium, FullConfig } from '@playwright/test'
import { hashPassword } from './lib/password'
import { execSync } from 'child_process'

// Clear the database
async function resetDatabase() {
  const [{ current_database }] = await prisma.$queryRaw<{ current_database: string }[]>`select current_database()`
  if (current_database !== 'db_dev') throw new Error(`Expected to connect to the dev database, got ${current_database}`)
  execSync(`prisma migrate reset --force --skip-generate`)
}

// Create a user and save state to ${handle}.storageState.json
async function createAndSaveUser(config, browser: Browser, { email, handle, displayName }) {
  const { baseURL } = config.projects[0].use
  await prisma.user.deleteMany({
    where: { handle }
  })
  await prisma.user.create({
    data: {
      email,
      handle,
      displayName,
      passwordHash: hashPassword('test')
    }
  })
  const page = await browser.newPage()
  await page.goto(`${baseURL}/Boards`)
  await page.click('text=Log in')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', 'test')
  await page.click('text=Sign in with credentials')
  await page.context().storageState({ path: `${handle}.storageState.json` })
  await page.click('text=Log out')
  await page.close()
}

async function globalSetup(config: FullConfig) {
  await resetDatabase()

  const browser = await chromium.launch()
  await createAndSaveUser(config, browser, {
    email: 'alice@woc.test',
    handle: 'alice',
    displayName: 'Alice T.'
  })
  await createAndSaveUser(config, browser, {
    email: 'bob@woc.test',
    handle: 'bob',
    displayName: 'Bob T.'
  })
  await browser.close()
}

export default globalSetup