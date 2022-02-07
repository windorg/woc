import { Reply, User, Comment, SubscriptionUpdate } from '@prisma/client'
import { prisma } from 'lib/db'
import { CanSee, canSeeReply, PComment, pCommentSelect, pReplySelect, unsafeCanSee } from 'lib/access'
import _ from 'lodash'
import { filterAsync, filterSync } from 'lib/array'

type Reply_ = Reply & {
  author: Pick<User, 'id' | 'email' | 'displayName'> | null
  comment: Pick<Comment, 'cardId'> & PComment
}

// Might be more options later
export type InboxItem =
  | { tag: "reply", id: SubscriptionUpdate['id'], reply: Reply_ }

async function getUnreadReplies(userId: User['id']): Promise<(CanSee & InboxItem)[]> {
  const items: InboxItem[] = await prisma.subscriptionUpdate.findMany({
    where: {
      subscriberId: userId,
      updateKind: 'suk_reply',
      isRead: false,
    },
    include: {
      reply: {
        include: {
          author: { select: { id: true, email: true, displayName: true } },
          comment: { select: { cardId: true, ...pCommentSelect } },
        }
      },
    },
  }).then(xs => filterSync(xs, item => item.reply !== null))
    .then(xs => filterSync(xs, item => canSeeReply(userId, item.reply!)))
    .then(xs => xs.map(x => ({ id: x.id, reply: x.reply!, tag: 'reply' })))
  return items.map(unsafeCanSee)
}

async function getUnreadRepliesCount(userId: User['id']): Promise<number> {
  const items = await prisma.subscriptionUpdate.findMany({
    where: {
      subscriberId: userId,
      updateKind: 'suk_reply',
      isRead: false,
    },
    include: {
      reply: { select: pReplySelect }
    },
  }).then(xs => filterSync(xs, item => item.reply !== null))
    .then(xs => filterSync(xs, item => canSeeReply(userId, item.reply!)))
  return items.length
}

export async function getInboxItems(userId: User['id']): Promise<(CanSee & InboxItem)[]> {
  return getUnreadReplies(userId)
}

export async function getInboxItemsCount(userId: User['id']): Promise<number> {
  return getUnreadRepliesCount(userId)
}