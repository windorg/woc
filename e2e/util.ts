import { expect, Page, Request, Route } from '@playwright/test'
import { prisma } from '../lib/db'
import randomWords from 'random-words'
import { hashPassword } from '../lib/password'

// Create a user (must be logged out) and save state to test-tmp/${handle}.storageState.json
//
// Returns the handle
export async function createAndSaveUser(
  page: Page,
  options?: { logout?: boolean },
  data?: { email, handle, displayName },
): Promise<string> {
  const randomHandle = randomWords(2).join('_')
  const { email, handle, displayName } =
    data ?? {
      email: `${randomHandle}@woc.test`,
      handle: randomHandle,
      displayName: randomHandle,
    }
  await prisma.user.deleteMany({
    where: { handle }
  })
  await prisma.user.create({
    data: {
      email,
      handle,
      displayName,
      passwordHash: hashPassword('test')
    }
  })
  await page.goto('/Boards')
  await page.click('text=Log in')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', 'test')
  await page.click('text=Sign in with credentials')
  await page.waitForSelector('text=Log out')
  await page.context().storageState({ path: `test-tmp/${handle}.storageState.json` })
  if (options?.logout) await page.click('text=Log out')
  return handle
}

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
      page.waitForNavigation({ url: '**/ShowBoard*' }),
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
      page.waitForNavigation({ url: '**/ShowCard*' }),
      page.click(`text=${name}`)
    ])
  }
  return name
}

// Create a comment. Assumes we are at the card page
export async function createComment(
  page: Page,
  options?: {
    private?: boolean
  }
): Promise<string> {
  expect(page.url().includes('/ShowCard'))
  const content = randomWords(4).join(' ')
  await page.click('.woc-comment-form .tiptap')
  await page.keyboard.type(content)
  if (options?.private) {
    await page.check('input[name="private"]')
  }
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
  const commentHandle = await page.locator('.woc-comment', { hasText: comment }).elementHandle()
  await (await commentHandle!.$('text=Reply'))?.click()
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

export async function interceptResponses<T>(
  pages: Page[],
  action: () => Promise<T>
): Promise<{ responses: [Request, string][], result: T }> {
  let responses: [Request, string][] = []
  const handler = async (route: Route, request: Request) => {
    try {
      const response = await request.frame().page().request.fetch(route.request())
      let body = await response.text()
      responses.push([route.request(), body])
      await route.fulfill({ response })
    } catch (error) {
      const re = /(Response has been disposed|Request context disposed|Failed to find browser context|browser has been closed)/g
      // @ts-ignore
      if (error.message.match(re)) return; else throw error
    }
  }
  for (const page of pages) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await page.route('**', handler)
  }
  const result = await action()
  for (const page of pages) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    await page.unroute('**', handler)
  }
  return { responses, result }
}