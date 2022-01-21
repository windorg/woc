import { test, expect } from '@playwright/test'
import { createBoard, createCard, expectNoLeakage, interceptResponses } from '../util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private cards should not be visible to others', async ({ page, browser }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobPage = await bobContext.newPage()

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const boardName = await createBoard(page, { navigate: true })
  const boardUrl = page.url()
  const cardName = await createCard(page, { private: true, navigate: true })
  const cardUrl = page.url()

  // Check that Alice can see the card
  await expect(page.locator('body')).toContainText(cardName)

  const { responses } = await interceptResponses([bobPage, anonPage], async () => {
    for (const somebodyPage of [bobPage, anonPage]) {
      // Expect that others can't access the card by the direct link
      await somebodyPage.goto(cardUrl)
      await expect(somebodyPage.locator('h1')).toHaveText(/404/)
      await expect(somebodyPage.locator('body')).not.toContainText(cardName)
      // Expect that others can't see the card in the board
      await somebodyPage.goto(boardUrl)
      await expect(somebodyPage.locator('body')).not.toContainText(cardName)
    }
  })
  expectNoLeakage(responses, [cardName])
})

test('Cards in private boards should not be visible to others', async ({ page, browser }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobPage = await bobContext.newPage()

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const boardName = await createBoard(page, { private: true, navigate: true })
  const boardUrl = page.url()
  const cardName = await createCard(page, { navigate: true })
  const cardUrl = page.url()

  // Check that Alice can see the card
  await expect(page.locator('body')).toContainText(cardName)

  const { responses } = await interceptResponses([bobPage, anonPage], async () => {
    for (const somebodyPage of [bobPage, anonPage]) {
      // Expect that others can't access the card by the direct link
      await somebodyPage.goto(cardUrl)
      await expect(somebodyPage.locator('h1')).toHaveText(/404/)
      await expect(somebodyPage.locator('body')).not.toContainText(cardName)
    }
  })
  expectNoLeakage(responses, [cardName])
})