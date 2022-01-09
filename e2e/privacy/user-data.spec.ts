import { test, expect, Page } from '@playwright/test'
import { createAndSaveUser, createBoard, createCard, createComment, createReply, expectNoLeakage, interceptResponses } from '../util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

const keywords = ['passwordHash', 'sha256', 'lockedAt']

test("Don't leak user data in user view", async ({ page, browser }) => {
  const { responses } = await interceptResponses([page], async () => {
    await createBoard(page, { navigate: true })
    await page.click('text=@alice')
    await page.waitForURL('**/ShowUser*')
  })
  expectNoLeakage(responses, keywords)
})

test("Don't leak user data in board view", async ({ page, browser }) => {
  const { responses } = await interceptResponses([page], async () => {
    await createBoard(page, { navigate: true })
  })
  expectNoLeakage(responses, keywords)
})

test("Don't leak user data in card view", async ({ page, browser }) => {
  const { responses } = await interceptResponses([page], async () => {
    await createBoard(page, { navigate: true })
    await createCard(page, { navigate: true })
  })
  expectNoLeakage(responses, keywords)
})

test("Don't leak user data in the inbox", async ({ page, browser }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobPage = await bobContext.newPage()

  const { responses } = await interceptResponses([page, bobPage], async () => {
    await createBoard(page, { navigate: true })
    await createCard(page, { navigate: true })
    const commentContent = await createComment(page)
    const cardUrl = page.url()
    {
      // TODO properly we should use a different way to wait for the comment to be committed to the DB
      await bobPage.waitForTimeout(250)
      await bobPage.goto(cardUrl)
      await createReply(bobPage, commentContent)
    }
    // TODO instead this should wait for the reply to end up in the database
    await page.waitForTimeout(250)
    await page.goto('/ShowInbox')
  })
  expectNoLeakage(responses, keywords)
})

test("Don't leak user data in the feed", async ({ page, browser }) => {
  const xContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const xPage = await xContext.newPage()
  await createAndSaveUser(xPage, { logout: false })

  const { responses } = await interceptResponses([page, xPage], async () => {
    await createBoard(page, { navigate: true })
    await createCard(page, { navigate: true })
    await createComment(page)
    await page.click('text=@alice')
    await page.waitForURL('**/ShowUser*')
    const aliceUrl = page.url()
    {
      await xPage.goto(aliceUrl)
      await xPage.click('text="Follow"')
      await xPage.waitForSelector('text="Unfollow"')
      await xPage.goto('/ShowFeed')
    }
  })
  expectNoLeakage(responses, keywords)
})