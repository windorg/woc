import { test, expect } from '@playwright/test'
import { createAndSaveUser, createBoard, createCard, createComment, expectNoLeakage, interceptResponses } from '../util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private comments should not be visible to others', async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const cardUrl = page.url()

  const publicComment = await createComment(page)
  const privateComment = await createComment(page, { private: true })

  // Get Alice's profile URL
  await Promise.all([
    page.waitForNavigation({ url: '**/ShowUser*' }),
    page.click('text=@alice')
  ])
  const aliceUrl = page.url()

  const xContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const xPage = await xContext.newPage()

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const { responses } = await interceptResponses([xPage, anonPage], async () => {
    // Create a new user just. Then, check that they can't see Alice's private comment *and* can't see it in their feed
    // if they follow Alice
    await createAndSaveUser(xPage, { logout: false })
    // They can see the public comment but not the private comment
    await xPage.goto(cardUrl)
    await xPage.locator('.woc-comment', { hasText: publicComment }).waitFor()
    await expect(xPage.locator('body')).not.toContainText(privateComment)
    // After following, they can see the public comment in the feed but not the private comment
    await xPage.goto(aliceUrl)
    await xPage.click('text="Follow"')
    await xPage.waitForSelector('text="Unfollow"')
    await xPage.goto('/ShowFeed')
    await xPage.locator('.woc-feed-item', { hasText: publicComment }).waitFor()
    await expect(xPage.locator('body')).not.toContainText(privateComment)

    // Check that a logged-out user can't see the private comment either
    await anonPage.goto(cardUrl)
    await anonPage.locator('.woc-comment', { hasText: publicComment }).waitFor()
    await expect(anonPage.locator('body')).not.toContainText(privateComment)
  })
  expectNoLeakage(responses, [privateComment])
})