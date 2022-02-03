import { Board, Card, User, Comment } from "@prisma/client"

export function boardsRoute() {
  return `/Boards`
}

export function userRoute(userId: User['id']) {
  return `/ShowUser?userId=${userId}`
}

export function boardRoute(boardId: Board['id']) {
  return `/ShowBoard?boardId=${boardId}`
}

export function cardRoute(cardId: Card['id']) {
  return `/ShowCard?cardId=${cardId}`
}

export function commentRoute(args: { cardId: Card['id'], commentId: Comment['id'] }) {
  return `/ShowCard?cardId=${args.cardId}#comment-${args.commentId}`
}

export function replyRoute(args: { cardId: Card['id'], replyId: Comment['id'] }) {
  return `/ShowCard?cardId=${args.cardId}#reply-${args.replyId}`
}

export function feedRoute() {
  return `/ShowFeed`
}

export function inboxRoute() {
  return `/ShowInbox`
}
