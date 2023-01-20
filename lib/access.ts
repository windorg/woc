import { Card, User, Comment, Reply } from '@prisma/client'
import { prisma } from './db'
import { cardSettings, commentSettings, replySettings } from './model-settings'

// Note: it makes sense that these functions should only be callable server-side because there might simply be not
// enough data client-side to decide if something is editable or not (e.g. "only X Y Z people can edit it" but the
// backend won't tell you the exact list of those people)

export async function canSeeCard<T extends { id: Card['id']; ownerId: Card['ownerId'] }>(
  userId: User['id'] | null,
  card: T
): Promise<boolean> {
  if (card.ownerId === userId) return true
  const fullCard = await prisma.card.findUniqueOrThrow({
    where: { id: card.id },
    include: { parent: { select: { id: true, ownerId: true } } },
  })
  return (
    cardSettings(fullCard).visibility === 'public' &&
    (fullCard.parent === null || (await canSeeCard(userId, fullCard.parent)))
  )
}
export function canEditCard<T extends { id: Card['id']; ownerId: Card['ownerId'] }>(
  userId: User['id'] | null,
  card: T
): boolean {
  if (!userId) return false // logged-out users cannot edit anything
  return card.ownerId === userId
}

export async function canSeeComment<T extends { id: Comment['id']; ownerId: Comment['ownerId'] }>(
  userId: User['id'] | null,
  comment: T
): Promise<boolean> {
  if (comment.ownerId === userId) return true
  const fullComment = await prisma.comment.findUniqueOrThrow({
    where: { id: comment.id },
    include: { card: { select: { id: true, ownerId: true } } },
  })
  return (
    commentSettings(fullComment).visibility === 'public' &&
    (await canSeeCard(userId, fullComment.card))
  )
}
export function canEditComment<T extends { id: Comment['id']; ownerId: Comment['ownerId'] }>(
  userId: User['id'] | null,
  comment: T
): boolean {
  if (!userId) return false // logged-out users cannot edit anything
  return comment.ownerId === userId
  // If this logic changes, you should also change the logic in card.tsx
}
export async function canReplyToComment<
  T extends { id: Comment['id']; ownerId: Comment['ownerId'] }
>(userId: User['id'] | null, comment: T): Promise<boolean> {
  if (!userId) return false // logged-out users cannot reply to anything
  // You can reply iff you can see the comment.
  return canSeeComment(userId, comment)
}

export async function canSeeReply<T extends { id: Reply['id']; authorId: Reply['authorId'] }>(
  userId: User['id'] | null,
  reply: T
): Promise<boolean> {
  if (reply.authorId === userId) return true
  const fullReply = await prisma.reply.findUniqueOrThrow({
    where: { id: reply.id },
    include: { comment: { select: { id: true, ownerId: true } } },
  })
  return (
    replySettings(fullReply).visibility === 'public' &&
    (await canSeeComment(userId, fullReply.comment))
  )
}
export function canEditReply<T extends { id: Reply['id']; authorId: Reply['authorId'] }>(
  userId: User['id'] | null,
  reply: T
): boolean {
  if (!userId) return false // logged-out users cannot edit anything
  return reply.authorId === userId
}
export function canDeleteReply<
  T extends { id: Reply['id']; authorId: Reply['authorId']; comment: Pick<Comment, 'ownerId'> }
>(userId: User['id'] | null, reply: T): boolean {
  if (!userId) return false // logged-out users cannot delete anything
  return (
    // The reply's author can always delete their own reply
    reply.authorId === userId ||
    // The comment's owner can always delete replies to their comments
    (userId !== null && reply.comment.ownerId === userId)
  )
}
