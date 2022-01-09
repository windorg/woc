import { test, expect } from '@playwright/test'
import { createBoard } from './util'

// TODO this test should use the leakage machinery

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private boards should not be visible to others', async ({ page, browser }) => {
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

  // Log in as Bob
  {
    const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    // Expect that the board is not accessible by the direct link
    await bobPage.goto(boardUrl)
    await expect(bobPage.locator('h1')).toHaveText(/404/)
    await expect(bobPage.locator('body')).not.toContainText(boardName)
    // Expect that the board is not visible in Alice's profile
    await bobPage.goto(aliceUrl)
    await expect(bobPage.locator('body')).not.toContainText(boardName)
  }

  // Log out
  {
    const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const anonPage = await anonContext.newPage()
    // Check that the board is not visible in the public boards list
    await anonPage.goto('/Boards')
    await expect(anonPage.locator('body')).not.toContainText(boardName)
  }
})