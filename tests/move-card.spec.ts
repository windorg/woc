import { test, expect } from '@playwright/test'
import { createBoard, createCard } from './util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Moving a card works', async ({ page }) => {
  const board1Name = await createBoard(page, { navigate: true })
  const board1Url = page.url()
  const board2Name = await createBoard(page, { navigate: true })
  const board2Url = page.url()
  const cardName = await createCard(page, { navigate: true })
  // Move from board 2 to board 1
  await page.locator('text=More').click()
  await page.locator('a[role="button"]:has-text("Move to")').click()
  await page.locator('input[role="combobox"]').fill(board1Name)
  await page.locator(`[aria-label="${board1Name}"]`).click()
  await page.locator('button:has-text("Move")').click()
  // The breadcrumbs should be updated
  await expect(page.locator(`[aria-label="breadcrumb"]`)).toContainText(board1Name)
  await expect(page.locator(`[aria-label="breadcrumb"]`)).not.toContainText(board2Name)
  // The card should be in board 1
  await page.goto(board1Url)
  await page.waitForSelector(`.woc-card:has-text("${cardName}")`)
  // The card should not be in board 2
  await page.goto(board2Url)
  await expect(page.locator('body')).not.toContainText(cardName)
})
