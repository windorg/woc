import { test, expect } from '@playwright/test'
import { createBoard, expectNoLeakage, interceptResponses } from '../util'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private boards should not be visible to others', async ({ page, browser }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobPage = await bobContext.newPage()

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonPage = await anonContext.newPage()

  const boardName = await createBoard(page, { private: true, navigate: true })
  const boardUrl = page.url()

  // Check that Alice can see the board
  await expect(page.locator('body')).toContainText(boardName)
  // Get Alice's profile URL
  await page.click('text=@alice')
  await page.waitForURL('**/ShowUser*')
  const aliceUrl = page.url()

  const { responses } = await interceptResponses([bobPage, anonPage], async () => {
    for (const somebodyPage of [bobPage, anonPage]) {
      // Check that others can't access the page by the direct link
      await somebodyPage.goto(boardUrl)
      await somebodyPage.waitForSelector('text=You do not have permission to access this card')
      await expect(somebodyPage.locator('body')).not.toContainText(boardName)
      // Check that others can't see the board in Alice's profile
      await somebodyPage.goto(aliceUrl)
      await expect(somebodyPage.locator('body')).not.toContainText(boardName)
      // Check that others can't see the board on the /Boards page
      await somebodyPage.goto('/Boards')
      await expect(somebodyPage.locator('body')).not.toContainText(boardName)
    }
  })
  expectNoLeakage(responses, [boardName])
})
