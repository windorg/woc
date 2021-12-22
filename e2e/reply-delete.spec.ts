import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply, expectReplyGone } from './util'

test.use({ storageState: 'alice.storageState.json' })

// TODO test that others' replies to your comments can be deleted

test('You can delete your own replies', async ({ page }) => {
  const boardName = await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const replyContent = await createReply(page, commentContent)

  // Delete the reply
  await page.click('_react=ReplyComponent >> text=More')
  await page.click('a[role="button"]:has-text("Delete")')

  // The reply should not be visible
  await expectReplyGone(page, replyContent)
})