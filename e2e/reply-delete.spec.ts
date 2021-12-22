import { test, expect } from '@playwright/test'

test.use({ storageState: 'alice.storageState.json' })

// TODO test that others' replies to your comments can be deleted

test('You can delete your own replies', async ({ page }) => {
  await page.goto('/Boards')

  // Create a board
  await page.click('text=+ New')
  await page.fill('[placeholder="Board title"]', 'Alice\'s board')
  await page.click('button:has-text("Create a board")')
  await Promise.all([
    page.waitForNavigation(),
    page.click('text=Alice\'s board')
  ])

  // Create a card
  await page.fill('[placeholder="Card title"]', 'Some card')
  await page.press('[placeholder="Card title"]', 'Enter')
  await Promise.all([
    page.waitForNavigation(),
    page.click('text=Some card')
  ])

  // Post a comment
  await page.click('.woc-comment-form .tiptap')
  await page.keyboard.type('Some comment')
  await page.click('button:has-text("Post")')

  // Post a reply
  await page.click('text=Reply')
  await page.click('.woc-reply-form .tiptap')
  await page.keyboard.type('Some reply')
  await page.click('button:has-text("Post a reply")')

  // The reply should be visible
  await expect(page.locator('body')).toHaveText(/.*Some reply.*/)

  // The reply should still be visible after a reload
  await page.reload()
  await page.waitForSelector('text=Alice\'s board')
  await expect(page.locator('body')).toHaveText(/.*Some reply.*/)

  // Delete the reply
  await page.click('.woc-comment-replies >> text=More')
  await page.click('a[role="button"]:has-text("Delete")')

  // The reply should not be visible
  await expect(page.locator('#layout')).not.toHaveText(/.*Some reply.*/)

  // The reply should still not be visible after a reload and should not be anywhere on the page, including props
  await page.reload()
  await page.waitForSelector('text=Alice\'s board')
  await expect(page.locator('body')).not.toHaveText(/.*Some reply.*/)
})