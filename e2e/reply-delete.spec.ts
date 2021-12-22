import { test, expect } from '@playwright/test'
import { createBoard, createCard } from './util'

test.use({ storageState: 'alice.storageState.json' })

// TODO test that others' replies to your comments can be deleted

test('You can delete your own replies', async ({ page }) => {
  const boardName = await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })

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
  await expect(page.locator('_react=ReplyComponent')).toContainText('Some reply')

  // The reply should still be visible after a reload
  await page.reload()
  await page.waitForSelector(`text=${boardName}`)
  await expect(page.locator('_react=ReplyComponent')).toContainText('Some reply')

  // Delete the reply
  await page.click('.woc-comment-replies >> text=More')
  await page.click('a[role="button"]:has-text("Delete")')

  // The reply should not be visible
  await expect(page.locator('#layout')).not.toContainText('Some reply')

  // The reply should still not be visible after a reload and should not be anywhere on the page, including props
  await page.reload()
  await page.waitForSelector(`text=${boardName}`)
  await expect(page.locator('body')).not.toContainText('Some reply')
})