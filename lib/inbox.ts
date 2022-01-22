import { Reply, User, Comment } from '@prisma/client'
import { prisma } from 'lib/db'
import { CanSee, canSeeReply, PComment, pCommentSelect, pReplySelect } from 'lib/access'
import _ from 'lodash'
import { filterAsync, filterSync } from 'lib/array'

type Reply_ = Reply & {
  author: Pick<User, 'id' | 'email' | 'displayName'> | null
  comment: Pick<Comment, 'cardId'> & PComment
}

// Might be more options later
export type InboxItem =
  | { tag: "reply" } & Reply_

async function getUnreadReplies(userId: User['id']): Promise<(CanSee & InboxItem)[]> {
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
          comment: { select: { cardId: true, ...pCommentSelect } },
        }
      },
    },
  }).then(xs => _.compact(xs.map(x => x.reply)))
    .then(xs => filterSync(xs, (reply): reply is Reply_ & CanSee => canSeeReply(userId, reply)))
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
    .then(xs => prisma.reply.findMany({
      where: { id: { in: xs } },
      select: pReplySelect,
    }))
    .then(xs => filterSync(xs, reply => canSeeReply(userId, reply)))
    .then(xs => xs.length)
}

export async function getInboxItems(userId: User['id']): Promise<(CanSee & InboxItem)[]> {
  return getUnreadReplies(userId)
}

export async function getInboxItemsCount(userId: User['id']): Promise<number> {
  return getUnreadRepliesCount(userId)
}