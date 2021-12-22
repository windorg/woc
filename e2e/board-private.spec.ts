import { test, expect } from '@playwright/test'

test.use({ storageState: 'alice.storageState.json' })

test('Private boards should not be visible to others', async ({ page, browser }) => {
  // Create a new private board
  await page.goto('/Boards')
  await page.click('text=+ New')
  await page.fill('[placeholder="Board title"]', 'Alice\'s private board')
  await page.check('input[name="private"]')
  await page.click('button:has-text("Create a board")')

  // Get the board's URL
  await page.click('text=Alice\'s private board')
  await page.waitForURL(/.*\/ShowBoard.*/)
  const boardUrl = page.url()

  // Check that Alice can see the board
  await expect(page.locator('body')).toHaveText(/.*Alice's private board.*/)

  // Get Alice's profile URL
  await page.click('text=@alice')
  await page.waitForURL(/.*\/ShowUser.*/)
  const aliceUrl = page.url()

  // Log in as Bob
  {
    const bobContext = await browser.newContext({ storageState: 'bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    // Expect that the board is not accessible by the direct link
    await bobPage.goto(boardUrl)
    await expect(bobPage.locator('h1')).toHaveText(/404/)
    await expect(bobPage.locator('body')).not.toHaveText(/.*Alice's private board.*/)
    // Expect that the board is not visible in Alice's profile
    await bobPage.goto(aliceUrl)
    await expect(bobPage.locator('body')).not.toHaveText(/.*Alice's private board.*/)
  }

  // Log out
  {
    const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const anonPage = await anonContext.newPage()
    // Check that the board is not visible in the public boards list
    await anonPage.goto('/Boards')
    await expect(anonPage.locator('body')).not.toHaveText(/.*Alice's private board.*/)
  }
})