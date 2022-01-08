import { test, expect, Page, Request } from '@playwright/test'
import { createAndSaveUser, createBoard, createCard, createComment, createReply } from './util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

async function expectNoLeakage(
  pages: Page[],
  actions: (ps: Page[]) => Promise<void>
) {
  let requests: [Request, string][] = []
  for (const page of pages) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await page.route(() => true, async route => {
      try {
        const response = await page.request.fetch(route.request())
        let body = await response.text()
        requests.push([route.request(), body])
        await route.fulfill({ response })
      } catch (error) {
        const re = /(Response has been disposed|Request context disposed|Failed to find browser context|browser has been closed)/g
        // @ts-ignore
        if (error.message.match(re)) return; else throw error
      }
    })
  }
  await actions(pages)
  for (const [request, response] of requests) {
    const matches = response.match(/(passwordHash|sha256|lockedAt)/g)
    if (matches) {
      console.error(`The response for ${request.url()} leaks data: ${matches}`)
      expect(true).toBeFalsy()
    }
  }
}

test("Don't leak user data in user view", async ({ page, browser }) => {
  await expectNoLeakage([page], async ([page]) => {
    await createBoard(page, { navigate: true })
    await Promise.all([
      page.waitForNavigation({ url: '**/ShowUser*' }),
      page.click('text=@alice')
    ])
  })
})

test("Don't leak user data in board view", async ({ page, browser }) => {
  await expectNoLeakage([page], async ([page]) => {
    await createBoard(page, { navigate: true })
  })
})

test("Don't leak user data in card view", async ({ page, browser }) => {
  await expectNoLeakage([page], async ([page]) => {
    await createBoard(page, { navigate: true })
    await createCard(page, { navigate: true })
  })
})

test("Don't leak user data in the inbox", async ({ page, browser }) => {
  const makePages = async () => {
    const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    return [page, bobPage]
  }
  await expectNoLeakage(await makePages(), async ([page, bobPage]) => {
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
})

test("Don't leak user data in the feed", async ({ page, browser }) => {
  const makePages = async () => {
    const xContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const xPage = await xContext.newPage()
    await createAndSaveUser(xPage, { logout: false })
    return [page, xPage]
  }
  await expectNoLeakage(await makePages(), async ([page, xPage]) => {
    await createBoard(page, { navigate: true })
    await createCard(page, { navigate: true })
    await createComment(page)
    await Promise.all([
      page.waitForNavigation({ url: '**/ShowUser*' }),
      page.click('text=@alice')
    ])
    const aliceUrl = page.url()
    {
      await xPage.goto(aliceUrl)
      await xPage.click('text="Follow"')
      await xPage.waitForSelector('text="Unfollow"')
      await xPage.goto('/ShowFeed')
    }
  })
})