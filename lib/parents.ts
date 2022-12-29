// Utilities for working with card parents

import { Card, PrismaClient } from '@prisma/client'

// For a card id, gives [topmost parent, child, grandchild, ..., id].
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
