import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply, expectReplyGone } from './util'

test.use({ storageState: 'alice.storageState.json' })

test('You can reply to your own comments', async ({ page }) => {
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
})

// TODO test that when you create a reply to someone else's comment, it shows your own name and not their name