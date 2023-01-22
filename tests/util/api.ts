import type * as GQL from 'generated/graphql/graphql'
import { APIRequestContext } from '@playwright/test'
import { User } from '@prisma/client'
import randomWords from 'random-words'
import { print } from 'graphql'
import { gql } from '@apollo/client'

export async function apiCreateBoard(
  request: APIRequestContext,
  options?: {
    private?: boolean
  }
): Promise<Pick<GQL.Card, 'id' | 'title'>> {
  const title = randomWords(3).join('-')
  return (
    await request.post('/api/graphql', {
      data: {
        query: print(gql`
          mutation createTopLevelCard($private: Boolean!, $title: String!) {
            createCard(parentId: null, private: $private, title: $title) {
              id
              title
            }
          }
        `),
        variables: {
          private: options?.private || false,
          title,
        },
        operationName: 'createTopLevelCard',
      },
    })
  )
    .json()
    .then((response) => response.data.createCard)
}

export async function apiCreateCard(
  request: APIRequestContext,
  options: {
    parentId: GQL.Card['id']
    private?: boolean
  }
): Promise<Pick<GQL.Card, 'id' | 'title'>> {
  const title = randomWords(3).join('-')
  return (
    await request.post('/api/graphql', {
      data: {
        query: print(gql`
          mutation createCard($parentId: UUID!, $private: Boolean!, $title: String!) {
            createCard(parentId: $parentId, private: $private, title: $title) {
              id
              title
            }
          }
        `),
        variables: {
          parentId: options.parentId,
          private: options?.private || false,
          title,
        },
        operationName: 'createCard',
      },
    })
  )
    .json()
    .then((response) => response.data.createCard)
}

export async function apiGetCard(
  request: APIRequestContext,
  options: {
    id: GQL.Card['id']
  }
): Promise<
  (Pick<GQL.Card, 'id' | 'title'> & { children: Pick<GQL.Card, 'id' | 'title'>[] }) | null
> {
  const response = await request.post('/api/graphql', {
    data: {
      query: print(gql`
        query getCard($id: UUID!) {
          card(id: $id) {
            id
            title
            children {
              id
              title
            }
          }
        }
      `),
      variables: {
        id: options.id,
      },
      operationName: 'getCard',
    },
  })
  return response.json().then((x) => (x.data ? x.data.card : null))
}
