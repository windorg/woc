/** Utilities for working with card parents */

import { Card, PrismaClient } from '@prisma/client'
import { deleteSync } from './array'

/** For a card id, gives [topmost parent, child, grandchild, ..., id]. */
export async function getCardChain(prisma: Pick<PrismaClient, 'card'>, id: Card['id']) {
  let chain: Card['id'][] = []
  let current: Card['id'] | null = id
  while (current) {
    chain = [current, ...chain]
    const parentCard = await prisma.card.findUniqueOrThrow({
      where: { id: current },
      select: { parentId: true },
    })
    current = parentCard.parentId
  }
  return chain
}

/**
 * Add a card as the first child of `parentId`.
 *
 * @returns The updated parent card.
 */
export async function addCardToParent(
  prisma: Pick<PrismaClient, 'card'>,
  cardId: string,
  parentId: string
): Promise<Card> {
  const { childrenOrder } = await prisma.card.findUniqueOrThrow({
    where: { id: parentId },
    select: { childrenOrder: true },
  })
  return await prisma.card.update({
    where: { id: parentId },
    data: { childrenOrder: [cardId, ...childrenOrder] },
  })
}

/**
 * Remove a card from children of `parentId`.
 *
 * @returns The updated parent card.
 */
export async function removeCardFromParent(
  prisma: Pick<PrismaClient, 'card'>,
  cardId: string,
  parentId: string
): Promise<Card> {
  const { childrenOrder } = await prisma.card.findUniqueOrThrow({
    where: { id: parentId },
    select: { childrenOrder: true },
  })
  return await prisma.card.update({
    where: { id: parentId },
    data: { childrenOrder: deleteSync(childrenOrder, cardId) },
  })
}
