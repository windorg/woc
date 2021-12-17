// Settings types used in most models (Board, Card, etc)

import { Board, Card, Comment, Reply, User } from "@prisma/client"

// If you ever change this, grep for 'private' and 'public'
export type Visibility = 'private' | 'public'

export type BoardSettings = {
  visibility: Visibility
}
export function boardSettings(board: Pick<Board, 'settings'>): BoardSettings {
  const def: BoardSettings = {
    visibility: 'public'
  }
  return { ...def, ...(board.settings as object) }
}

export type CardSettings = {
  visibility: Visibility
  // Whether to show updates from oldest to newest
  reverseOrder: boolean
  archived: boolean
}
export function cardSettings(card: Pick<Card, 'settings'>): CardSettings {
  const def: CardSettings = {
    visibility: 'public',
    reverseOrder: false,
    archived: false
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
    visibility: 'public',
    pinned: false,
    subscribers: []
  }
  return { ...def, ...(comment.settings as object) }
}

export type ReplySettings = {
  visibility: Visibility
}
export function replySettings(reply: Pick<Reply, 'settings'>): ReplySettings {
  const def: ReplySettings = {
    visibility: 'public',
  }
  return { ...def, ...(reply.settings as object) }
}