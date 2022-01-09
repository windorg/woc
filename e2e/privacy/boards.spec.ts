import { test, expect } from '@playwright/test'
import { createBoard, expectNoLeakage, interceptResponses } from '../util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private boards should not be visible to others', async ({ page, browser }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobPage = await bobContext.newPage()

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const boardName = await createBoard(page, { private: true, navigate: true })
  const boardUrl = page.url()

  // Check that Alice can see the board
  await expect(page.locator('body')).toContainText(boardName)
  // Get Alice's profile URL
  await Promise.all([
    page.waitForNavigation({ url: '**/ShowUser*' }),
    page.click('text=@alice')
  ])
  const aliceUrl = page.url()

  const { responses } = await interceptResponses([bobPage, anonPage], async () => {
    // Expect that Bob can't access the page by the direct link
    await bobPage.goto(boardUrl)
    await expect(bobPage.locator('h1')).toHaveText(/404/)
    await expect(bobPage.locator('body')).not.toContainText(boardName)
    // Expect that Bob can't see the board in Alice's profile
    await bobPage.goto(aliceUrl)
    await expect(bobPage.locator('body')).not.toContainText(boardName)
    // Expect that a logged-out user can't access the page by the direct link
    await anonPage.goto('/Boards')
    await expect(anonPage.locator('body')).not.toContainText(boardName)
  })
  expectNoLeakage(responses, [boardName])
})