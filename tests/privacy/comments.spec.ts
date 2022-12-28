import { test, expect } from '@playwright/test'
import { createAndSaveUser, createBoard, createCard, createComment, expectNoLeakage, interceptResponses } from '../util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private comments should not be visible to others', async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const cardUrl = page.url()

  const publicComment = await createComment(page)
  const privateComment = await createComment(page, { private: true })

  const xContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const xPage = await xContext.newPage()
  await createAndSaveUser(xPage, { logout: false })

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const { responses } = await interceptResponses([xPage, anonPage], async () => {
    for (const somebodyPage of [xPage, anonPage]) {
      // Others can see the public comment but not the private comment
      await somebodyPage.goto(cardUrl)
      await somebodyPage.locator('.woc-comment', { hasText: publicComment }).waitFor()
      await expect(somebodyPage.locator('body')).not.toContainText(privateComment)
    }
  })
  expectNoLeakage(responses, [privateComment])
})

test('Private comments (or from private cards, boards) should not appear in feeds', async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  const publicBoardUrl = page.url()

  await page.goto(publicBoardUrl)
  await createCard(page, { navigate: true })
  const publicCardUrl = page.url()

  await page.goto(publicBoardUrl)
  await createCard(page, { private: true, navigate: true })
  const privateCardUrl = page.url()

  await page.goto('/Boards')
  await createBoard(page, { private: true, navigate: true })
  await createCard(page, { navigate: true })
  const publicCardInPrivateBoardUrl = page.url()

  await page.goto(publicCardUrl)
  const publicComment = await createComment(page)
  // Private comment
  const privateComment1 = await createComment(page, { private: true })
  // Public comment on a private card
  await page.goto(privateCardUrl)
  const privateComment2 = await createComment(page)
  // Public comment on a public card in a private board
  await page.goto(publicCardInPrivateBoardUrl)
  const privateComment3 = await createComment(page)

  const privateComments = [privateComment1, privateComment2, privateComment3]

  // Get Alice's profile URL
  await page.click('text=@alice')
  await page.waitForURL('**/ShowUser*')
  const aliceUrl = page.url()

  const xContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const xPage = await xContext.newPage()
  await createAndSaveUser(xPage, { logout: false })

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const { responses } = await interceptResponses([xPage, anonPage], async () => {
    // Follow Alice
    await xPage.goto(aliceUrl)
    await xPage.click('text="Follow"')
    await xPage.waitForSelector('text="Unfollow"')

    // After following, the new user can see the public comment in the feed
    await xPage.goto('/ShowFeed')
    await xPage.locator('.woc-feed-item', { hasText: publicComment }).waitFor()
    // But not any of the private comments
    for (const privateComment of privateComments) {
      await expect(xPage.locator('body')).not.toContainText(privateComment)
    }

    // Just in case: anon users can't see the private comments in the feed (the feed shouldn't work for them at all)
    await anonPage.goto('/ShowFeed')
    await expect(anonPage.locator('body')).not.toContainText(publicComment)
    for (const privateComment of privateComments) {
      await expect(anonPage.locator('body')).not.toContainText(privateComment)
    }
  })
  expectNoLeakage(responses, privateComments)
})
