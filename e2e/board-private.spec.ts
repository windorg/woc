import { test, expect } from '@playwright/test'

test('private boards should not be visible to others', async ({ page }) => {
  // TODO use state to log in as Alice
  await page.goto('/Boards')
  await page.click('text=Log in')
  await page.fill('[placeholder="email@example.com"]', 'alice@woc.test')
  await page.fill('[placeholder="Password"]', 'test')
  await page.click('text=Sign in with credentials')

  // Create a new private board as Alice
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

  // TODO: profile URL test
  // TODO: "all public boards" test

  // // Get Alice's profile URL
  // await page.click('text=@alice')
  // // await page.waitForURL(/.*\/ShowUser.*/)
  // const aliceUrl = page.url()

  await page.click('text=Log out')

  // Log in as Bob
  await page.click('text=Log in')
  await page.fill('[placeholder="email@example.com"]', 'bob@woc.test')
  await page.fill('[placeholder="Password"]', 'test')
  await page.click('text=Sign in with credentials')

  // Expect that the board is not accessible by the direct link
  await page.goto(boardUrl)
  await expect(page.locator('h1')).toHaveText(/404/)
  await expect(page.locator('body')).not.toHaveText(/.*Alice's private board.*/)

  // // Expect that the board is not visible in Alice's profile
  // await page.goto(aliceUrl)
  // await expect(page.locator('body')).not.toHaveText(/.*Alice's private board.*/)
})