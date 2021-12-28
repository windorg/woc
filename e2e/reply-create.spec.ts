import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply, expectReplyGone } from './util'

test.use({ storageState: 'alice.storageState.json' })

test("You can reply to your own comments", async ({ page }) => {
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

// This was buggy once
test("When you reply to someone else's comment, it shows your name", async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const cardUrl = page.url()
  // Leave a reply as Bob
  {
    const bobContext = await browser.newContext({ storageState: 'bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    await bobPage.goto(cardUrl)
    await createReply(bobPage, commentContent)
    // Would have used a more specific selector but see https://github.com/microsoft/playwright/issues/11071
    await expect(bobPage.locator('_react=ReplyComponent')).not.toContainText("Alice T.")
    await expect(bobPage.locator('_react=ReplyComponent')).toContainText("Bob T.")
  }
})

test("Your replies show up in the other person's inbox", async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const cardUrl = page.url()
  // Leave a reply as Bob
  let replyContent
  {
    const bobContext = await browser.newContext({ storageState: 'bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    await bobPage.goto(cardUrl)
    replyContent = await createReply(bobPage, commentContent)
    // TODO instead this should wait for the reply to end up in the database
    await page.waitForTimeout(250)
  }
  // Check that the reply shows up at the top of Alice's inbox
  await page.goto('/ShowInbox')
  await expect(page.locator('.woc-inbox-item >> nth=0')).toContainText(replyContent)
})