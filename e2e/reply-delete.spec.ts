import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply, expectReplyGone } from './util'

test.use({ storageState: 'alice.storageState.json' })

test("You can delete your own replies", async ({ page }) => {
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

test("You can delete others' replies to your comments", async ({ page, browser }) => {
  const boardName = await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const cardUrl = page.url()

  // Leave a reply as Bob
  let replyContent: string
  {
    const bobContext = await browser.newContext({ storageState: 'bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    await bobPage.goto(cardUrl)
    replyContent = await createReply(bobPage, commentContent)
  }

  // Delete the reply
  await page.waitForTimeout(1000)
  await page.reload()
  await page.waitForSelector(`:has-text("${replyContent}")`)
  await page.click('_react=ReplyComponent >> text=More')
  await page.click('a[role="button"]:has-text("Delete")')

  // The reply should not be visible
  await expectReplyGone(page, replyContent)
})