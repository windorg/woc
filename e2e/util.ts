import { expect, Page } from '@playwright/test'
import { prisma } from '../lib/db'
import randomWords from 'random-words'

export async function createBoard(
  page: Page,
  options?: {
    private?: boolean
    navigate?: boolean
  }
): Promise<string> {
  const name = randomWords(3).join(' ')
  await page.goto('/Boards')
  await page.click('text=+ New')
  await page.fill('[placeholder="Board title"]', name)
  if (options?.private) {
    await page.check('input[name="private"]')
  }
  await page.click('button:has-text("Create a board")')
  if (options?.navigate) {
    await Promise.all([
      page.waitForNavigation(),
      page.click(`text=${name}`)
    ])
  }
  return name
}

// Create a card. Assumes we are at the board page
export async function createCard(
  page: Page,
  options?: { navigate?: boolean }
): Promise<string> {
  expect(page.url().includes('/ShowBoard'))
  const name = randomWords(3).join(' ')
  await page.fill('[placeholder="Card title"]', name)
  await page.press('[placeholder="Card title"]', 'Enter')
  if (options?.navigate) {
    await Promise.all([
      page.waitForNavigation(),
      page.click(`text=${name}`)
    ])
  }
  return name
}

// Create a comment. Assumes we are at the card page
export async function createComment(
  page: Page
): Promise<string> {
  expect(page.url().includes('/ShowCard'))
  const content = randomWords(4).join(' ')
  await page.click('.woc-comment-form .tiptap')
  await page.keyboard.type(content)
  await page.click('button:has-text("Post")')
  return content
}

// Create a reply for a comment with given content. Assumes we are at the card page
export async function createReply(
  page: Page,
  comment: string
): Promise<string> {
  expect(page.url().includes('/ShowCard'))
  const content = randomWords(4).join(' ')
  const commentHandle = await page.waitForSelector(`*_react=CommentComponent >> :has-text("${comment}")`);
  (await commentHandle.$('text=Reply'))?.click()
  await page.click('.woc-reply-form .tiptap')
  await page.keyboard.type(content)
  await page.click('button:has-text("Post a reply")')
  return content
}

// Expect a reply with certain text to not be present on the page and in the database
export async function expectReplyGone(page: Page, replyContent: string) {
  expect(page.url().includes('/ShowCard'))
  await expect(page.locator('#layout')).not.toContainText(replyContent)
  const reply = await prisma.reply.findFirst({
    where: {
      content: { contains: replyContent }
    }
  })
  expect(reply === null)
}