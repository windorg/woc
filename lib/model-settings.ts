// Settings types used in most models (Board, Card, etc)

import { Board, Card, CardUpdate, User } from "@prisma/client"

// If you ever change this, grep for 'private' and 'public'
export type Visibility = 'private' | 'public'

export type BoardSettings = {
  visibility: Visibility
}
export function boardSettings(board: Board): BoardSettings {
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
export function cardSettings(card: Card): CardSettings {
  const def: CardSettings = {
    visibility: 'public',
    reverseOrder: false,
    archived: false
  }
  return { ...def, ...(card.settings as object) }
}

export type CardUpdateSettings = {
  visibility: Visibility
  // Whether the card update is pinned. Several card updates can be pinned in the same card.
  pinned: boolean
  // Who is following the thread (e.g. all users that replied to it). Does not include the card owner.
  subscribers: User['id'][]
}
export function cardUpdateSettings(cardUpdate: CardUpdate): CardUpdateSettings {
  const def: CardUpdateSettings = {
    visibility: 'public',
    pinned: false,
    subscribers: []
  }
  return { ...def, ...(cardUpdate.settings as object) }
}