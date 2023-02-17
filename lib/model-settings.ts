// Settings types used in most models (Board, Card, etc)

import { Card, Comment, Reply, User } from '@prisma/client'

/**
 * Card, comment, reply visibility.
 *
 * This is the backend type and should not leak into the frontend. Use GQL.Visibility in the frontend.
 */
export enum Visibility {
  Private = 'private',
  Public = 'public',
}

export type UserSettings = {
  beeminderUsername: string | null
  beeminderAccessToken: string | null
  betaAccess: boolean
}
export function userSettings(user: Pick<User, 'settings'>): UserSettings {
  const def: UserSettings = {
    beeminderUsername: null,
    beeminderAccessToken: null,
    betaAccess: false,
  }
  return { ...def, ...(user.settings as object) }
}

export type CardSettings = {
  visibility: Visibility
  // Whether to show updates from oldest to newest
  reverseOrder: boolean
  archived: boolean
  // Beeminder goal to sync with (goal name in the current user's connected Beeminder account)
  beeminderGoal: string | null
}
export function cardSettings(card: Pick<Card, 'settings'>): CardSettings {
  const def: CardSettings = {
    visibility: Visibility.Public,
    reverseOrder: false,
    archived: false,
    beeminderGoal: null,
  }
  return { ...def, ...(card.settings as object) }
}

export type CommentSettings = {
  visibility: Visibility
  // Whether the comment is pinned. Several card updates can be pinned in the same card.
  pinned: boolean
  // Who is following the thread (e.g. all users that replied to it). Does not include the card owner.
  subscribers: User['id'][]
}
export function commentSettings(comment: Pick<Comment, 'settings'>): CommentSettings {
  const def: CommentSettings = {
    visibility: Visibility.Public,
    pinned: false,
    subscribers: [],
  }
  return { ...def, ...(comment.settings as object) }
}

export type ReplySettings = {
  visibility: Visibility
}
export function replySettings(reply: Pick<Reply, 'settings'>): ReplySettings {
  const def: ReplySettings = {
    visibility: Visibility.Public,
  }
  return { ...def, ...(reply.settings as object) }
}
