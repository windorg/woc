import { Page } from '@playwright/test'
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