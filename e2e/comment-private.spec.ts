import { test, expect } from '@playwright/test'
import { createAndSaveUser, createBoard, createCard, createComment } from './util'

test.use({ storageState: 'alice.storageState.json' })

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

  // Create a new user just for this test. Then, check that they can't see Alice's private comment *and* can't see it in
  // their feed if they follow Alice
  {
    const xContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const xPage = await xContext.newPage()
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
  }

  // Check that a logged-out user can't see the private comment either
  {
    const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const anonPage = await anonContext.newPage()
    // They can see the public comment but not the private comment
    await anonPage.goto(cardUrl)
    await anonPage.locator('.woc-comment', { hasText: publicComment }).waitFor()
    await expect(anonPage.locator('body')).not.toContainText(privateComment)
  }
})