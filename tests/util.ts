import { expect, Page, Request, Route } from '@playwright/test'
import { prisma } from '../lib/db'
import randomWords from 'random-words'
import { hashPassword } from '../lib/password'
import { filterSync } from '../lib/array'

// A helper for Bootstrap modals. Waits for the modal to appear & disappear fully. Should help w/ flaky tests.
export async function withBootstrapModal(
  page: Page,
  open: () => Promise<void>,
  action: () => Promise<void>
) {
  // Unfortunately this is still flaky, so I'm using a timeout instead

  // await Promise.all([
  //   page.waitForSelector('div[role="dialog"].show', { state: 'visible' }),
  //   open()
  // ])
  // await Promise.all([
  //   page.waitForSelector('div[role="dialog"]', { state: 'hidden' }),
  //   action()
  // ])

  await open()
  await page.waitForTimeout(500)
  await page.waitForSelector('div[role="dialog"].show', { state: 'visible' })

  await action()
  await page.waitForTimeout(500)
  await page.waitForSelector('div[role="dialog"]', { state: 'hidden' })
}

// Create a user (must be logged out) and save state to test-tmp/${handle}.storageState.json
//
// Returns the handle
export async function createAndSaveUser(
  page: Page,
  options?: { logout?: boolean },
  data?: { email: string; handle: string; displayName: string }
): Promise<string> {
  const randomHandle = randomWords(2).join('-')
  const { email, handle, displayName } = data ?? {
    email: `${randomHandle}@woc.test`,
    handle: randomHandle,
    displayName: randomHandle,
  }
  await prisma.user.deleteMany({
    where: { handle },
  })
  await prisma.user.create({
    data: {
      email,
      handle,
      displayName,
      passwordHash: hashPassword('test'),
    },
  })
  await page.goto('/Boards')
  await page.click('text=Log in')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', 'test')
  await page.click('text=Sign in with credentials')
  await page.waitForSelector('text=Account')
  await page.context().storageState({ path: `test-tmp/${handle}.storageState.json` })
  if (options?.logout) {
    await page.click('text=Account')
    await page.click('text=Log out')
  }
  return handle
}

export async function createBoard(
  page: Page,
  options?: {
    private?: boolean
    navigate?: boolean
  }
): Promise<string> {
  const name = randomWords(3).join('-')
  await page.goto('/Boards')
  await withBootstrapModal(
    page,
    async () => await page.click('text=+ New'),
    async () => {
      await page.fill('[placeholder="Board title"]', name)
      if (options?.private) {
        await page.check('input[name="private"]')
      }
      await page.click('button:has-text("Create a board")')
    }
  )
  if (options?.navigate) {
    await Promise.all([page.waitForNavigation(), page.click(`a:text("${name}")`)])
  }
  return name
}

// Create a card. Assumes we are at the board page
export async function createCard(
  page: Page,
  options?: {
    private?: boolean
    navigate?: boolean
  }
): Promise<string> {
  expect(page.url().includes('/card'))
  const name = randomWords(3).join('-')
  await page.focus('[placeholder="New card..."]')
  await page.fill('[placeholder="New card..."]', name)
  if (options?.private) {
    await page.check('input[name="private"]')
  }
  await page.press('[placeholder="New card..."]', 'Enter')
  if (options?.navigate) {
    await Promise.all([page.waitForNavigation(), page.click(`a:text("${name}")`)])
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
  expect(page.url().includes('/card'))
  const content = randomWords(4).join('-')
  await page.click('.woc-comment-form .tiptap')
  await page.keyboard.type(content)
  if (options?.private) {
    await page.check('.woc-comment-form input[name="private"]')
  }
  await page.click('.woc-comment-form button:has-text("Post")')
  return content
}

// Create a reply for a comment with given content. Assumes we are at the card page
export async function createReply(page: Page, comment: string): Promise<string> {
  expect(page.url().includes('/card'))
  const content = randomWords(4).join('-')
  const commentHandle = await page.locator('.woc-comment', { hasText: comment }).elementHandle()
  await withBootstrapModal(
    page,
    async () => await (await commentHandle!.$('text=Reply'))?.click(),
    async () => {
      await page.click('.woc-reply-form .tiptap')
      await page.keyboard.type(content)
      await page.click('button:has-text("Post a reply")')
    }
  )
  return content
}

// Expect a reply with certain text to not be present on the page and in the database
export async function expectReplyGone(page: Page, replyContent: string) {
  expect(page.url().includes('/card'))
  await expect(page.locator('#layout')).not.toContainText(replyContent)
  const reply = await prisma.reply.findFirst({
    where: {
      content: { contains: replyContent },
    },
  })
  expect(reply === null)
}

export async function interceptResponses<T>(
  pages: Page[],
  action: () => Promise<T>
): Promise<{ responses: [Request, string][]; result: T }> {
  let responses: [Request, string][] = []
  const handler = async (route: Route, request: Request) => {
    try {
      const response = await request.frame().page().request.fetch(route.request())
      let body = await response.text()
      responses.push([route.request(), body])
      await route.fulfill({ response })
    } catch (error) {
      const re =
        /(Response has been disposed|Request context disposed|Failed to find browser context|browser has been closed)/g
      // @ts-ignore
      if (error.message.match(re)) return
      else throw error
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

export function expectNoLeakage(responses: [Request, string][], blacklist: string[]) {
  for (const [request, response] of responses) {
    const matches = filterSync(blacklist, (word) => response.includes(word))
    if (matches.length > 0) {
      // @ts-ignore
      expect(null).fail(`The response for ${request.url()} leaks data: ${JSON.stringify(matches)}`)
    }
  }
}
