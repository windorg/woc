import { test, expect } from '@playwright/test'
import { apiCreateBoard, apiCreateCard, apiGetCard } from '../util/api'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private cards should not be visible to others', async ({ page, browser, request }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobRequest = (await bobContext.newPage()).request

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonRequest = (await anonContext.newPage()).request

  const board = await apiCreateBoard(request)
  const card = await apiCreateCard(request, { parentId: board.id, private: true })

  // Check that Alice can see the card
  expect((await apiGetCard(request, { id: card.id }))?.title).toBe(card.title)

  // Expect that others can't access the card
  expect(await apiGetCard(bobRequest, { id: card.id })).toStrictEqual(null)
  expect(await apiGetCard(anonRequest, { id: card.id })).toStrictEqual(null)

  // Expect that others can't see the card in the board
  expect((await apiGetCard(bobRequest, { id: board.id }))?.children).toEqual([])
  expect((await apiGetCard(anonRequest, { id: board.id }))?.children).toEqual([])
})

test('Cards in private boards should not be visible to others', async ({
  page,
  browser,
  request,
}) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobRequest = (await bobContext.newPage()).request

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonRequest = (await anonContext.newPage()).request

  const board = await apiCreateBoard(request, { private: true })
  const card = await apiCreateCard(request, { parentId: board.id })

  // Check that Alice can see the card
  expect((await apiGetCard(request, { id: card.id }))?.title).toBe(card.title)

  // Expect that others can't access the card
  expect(await apiGetCard(bobRequest, { id: card.id })).toStrictEqual(null)
  expect(await apiGetCard(anonRequest, { id: card.id })).toStrictEqual(null)
})
