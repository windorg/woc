import { Reply, User, Comment } from '@prisma/client'
import { prisma } from 'lib/db'
import { canSeeReply } from 'lib/access'
import _ from 'lodash'
import { filterAsync } from 'lib/array'

// Might be more options later
export type InboxItem =
  { tag: "reply" } & Reply & {
    author: Pick<User, 'id' | 'email' | 'displayName'> | null
    comment: Pick<Comment, 'cardId'>
  }

async function getUnreadReplies(userId: User['id']): Promise<InboxItem[]> {
  return prisma.subscriptionUpdate.findMany({
    where: {
      subscriberId: userId,
      updateKind: 'suk_reply',
      isRead: false,
    },
    include: {
      reply: {
        include: {
          author: { select: { id: true, email: true, displayName: true } },
          comment: { select: { cardId: true } },
        }
      },
    },
  }).then(xs => _.compact(xs.map(x => x.reply)))
    .then(async xs => filterAsync(xs, async x => canSeeReply(userId, x.id)))
    .then(xs => xs.map(x => ({ ...x, tag: 'reply' })))
}

async function getUnreadRepliesCount(userId: User['id']): Promise<number> {
  return prisma.subscriptionUpdate.findMany({
    where: {
      subscriberId: userId,
      updateKind: 'suk_reply',
      isRead: false,
    },
  }).then(xs => _.compact(xs.map(x => x.replyId)))
    .then(async xs => filterAsync(xs, async x => canSeeReply(userId, x)))
    .then(xs => xs.length)
}

export async function getInboxItems(userId: User['id']): Promise<InboxItem[]> {
  return getUnreadReplies(userId)
}

export async function getInboxItemsCount(userId: User['id']): Promise<number> {
  return getUnreadRepliesCount(userId)
}