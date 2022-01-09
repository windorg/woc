import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply, expectReplyGone } from './util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test("You can reply to your own comments", async ({ page }) => {
  const boardName = await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const replyContent = await createReply(page, commentContent)
  // The reply should be visible
  await expect(page.locator('.woc-reply')).toContainText(replyContent)
  // The reply should still be visible after a reload
  await page.reload()
  await page.waitForSelector('.woc-reply')
  await expect(page.locator('.woc-reply')).toContainText(replyContent)
})

// This was buggy once
test("When you reply to someone else's comment, it shows your name", async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const cardUrl = page.url()
  // Leave a reply as Bob
  {
    const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    await bobPage.goto(cardUrl)
    const replyContent = await createReply(bobPage, commentContent)
    await expect(bobPage.locator('.woc-reply', { hasText: replyContent })).not.toContainText("Alice T.")
    await expect(bobPage.locator('.woc-reply', { hasText: replyContent })).toContainText("Bob T.")
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
    const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    await bobPage.goto(cardUrl)
    replyContent = await createReply(bobPage, commentContent)
    // TODO instead this should wait for the reply to end up in the database
    await page.waitForTimeout(250)
  }
  // Check that the reply shows up in Alice's inbox
  await page.goto('/ShowInbox')
  await page.locator('.woc-inbox-item', { hasText: replyContent }).waitFor()
})