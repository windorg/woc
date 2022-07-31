import { APIRequestContext } from "@playwright/test"
import { Card, User } from "@prisma/client"
import type { GetCardData, GetCardResponse } from "@pages/api/cards/get"
import type { ListCardsData, ListCardsResponse } from "@pages/api/cards/list"
import randomWords from "random-words"

export async function apiCreateBoard(
  request: APIRequestContext,
  options?: {
    private?: boolean
  }
): Promise<Card> {
  const title = randomWords(3).join('-')
  return (await request.post('/api/cards/create', {
    data: {
      parentId: null,
      title,
      private: options?.private || false
    }
  })).json()
}

export async function apiCreateCard(
  request: APIRequestContext,
  options: {
    parentId: Card['id']
    private?: boolean
  }
): Promise<Card> {
  const title = randomWords(3).join('-')
  return (await request.post('/api/cards/create', {
    data: {
      parentId: options.parentId,
      title,
      private: options?.private || false
    }
  })).json()
}

export async function apiGetCard(
  request: APIRequestContext,
  options: {
    id: Card['id']
  }
): Promise<GetCardResponse> {
  const response = await (await request.get('/api/cards/get', {
    params: {
      cardId: options.id
    }
  })).json()
  return response
}

export async function apiListCards(
  request: APIRequestContext,
  options: {
    parents?: Card['id'][]
    owners?: User['id'][]
    onlyTopLevel?: boolean
  }
): Promise<ListCardsResponse> {
  const response = await (await request.get('/api/cards/list', {
    params: {
      ...('parents' in options ? { parents: JSON.stringify(options.parents) } : {}),
      ...('owners' in options ? { owners: JSON.stringify(options.owners) } : {}),
      ...('onlyTopLevel' in options ? { onlyTopLevel: options.onlyTopLevel } : {})
    }
  })).json()
  return response
}