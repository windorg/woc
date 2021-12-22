import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply, expectReplyGone } from './util'

test.use({ storageState: 'alice.storageState.json' })

// TODO test that others' replies to your comments can be deleted

test('You can delete your own replies', async ({ page }) => {
  const boardName = await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const replyContent = await createReply(page, commentContent)

  // The reply should be visible
  await expect(page.locator('_react=ReplyComponent')).toContainText(replyContent)

  // The reply should still be visible after a reload
  await page.reload()
  await page.waitForSelector('_react=ReplyComponent')
  await expect(page.locator('_react=ReplyComponent')).toContainText(replyContent)

  // Delete the reply
  await page.click('_react=ReplyComponent >> text=More')
  await page.click('a[role="button"]:has-text("Delete")')

  // The reply should not be visible
  await expectReplyGone(page, replyContent)
})