// Settings types used in most models (Board, Card, etc)

import { Board, Card } from "@prisma/client";

export type Visibility = 'private' | 'public'

export function checkPrivate(x: Visibility): boolean {
  switch (x) {
    case 'private': return true;
    case 'public': return false;
  }
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

export type BoardSettings = {
  visibility: Visibility
}

export function boardSettings(board: Board): BoardSettings {
  const def: BoardSettings = {
    visibility: 'public'
  }
  return { ...def, ...(board.settings as object) }
}