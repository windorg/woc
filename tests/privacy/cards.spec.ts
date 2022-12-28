import { test, expect } from '@playwright/test'
import { apiCreateBoard, apiCreateCard, apiGetCard, apiListCards } from '../util/api'

test.use({ storageState: 'test-tmp/alice.storageState.json' })

test('Private cards should not be visible to others', async ({ page, browser, request }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobRequest = (await bobContext.newPage()).request

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonRequest = (await anonContext.newPage()).request

  const board = await apiCreateBoard(request)
  const card = await apiCreateCard(request, { parentId: board.id, private: true })

  // Check that Alice can see the card
  expect((await apiGetCard(request, { id: card.id }))['data'].title).toBe(card.title)

  // Expect that others can't access the card
  expect(await apiGetCard(bobRequest, { id: card.id })).toStrictEqual({ success: false, error: { notFound: true } })
  expect(await apiGetCard(anonRequest, { id: card.id })).toStrictEqual({ success: false, error: { notFound: true } })

  // Expect that others can't see the card in the board
  expect(await apiListCards(bobRequest, { parents: [board.id] })).toEqual({ success: true, data: [] })
  expect(await apiListCards(anonRequest, { parents: [board.id] })).toEqual({ success: true, data: [] })
})

test('Cards in private boards should not be visible to others', async ({ page, browser, request }) => {
  const bobContext = await browser.newContext({ storageState: 'test-tmp/bob.storageState.json' })
  const bobRequest = (await bobContext.newPage()).request

  const anonContext = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const anonRequest = (await anonContext.newPage()).request

  const board = await apiCreateBoard(request, { private: true })
  const card = await apiCreateCard(request, { parentId: board.id })

  // Check that Alice can see the card
  expect((await apiGetCard(request, { id: card.id }))['data'].title).toBe(card.title)

  // Expect that others can't access the card
  expect(await apiGetCard(bobRequest, { id: card.id })).toStrictEqual({ success: false, error: { notFound: true } })
  expect(await apiGetCard(anonRequest, { id: card.id })).toStrictEqual({ success: false, error: { notFound: true } })
})
