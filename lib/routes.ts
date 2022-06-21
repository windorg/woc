import { Card, User, Comment } from "@prisma/client"

export function accountRoute() {
  return `/account`
}

export function boardsRoute() {
  return `/Boards`
}

export function userRoute(userId: User['id']) {
  return `/ShowUser?userId=${userId}`
}

export function cardRoute(cardId: Card['id']) {
  return `/card?id=${cardId}`
}

export function commentRoute(args: { cardId: Card['id'], commentId: Comment['id'] }) {
  return `/card?id=${args.cardId}#comment-${args.commentId}`
}

export function replyRoute(args: { cardId: Card['id'], replyId: Comment['id'] }) {
  return `/card?id=${args.cardId}#reply-${args.replyId}`
}

export function feedRoute() {
  return `/ShowFeed`
}

export function inboxRoute() {
  return `/ShowInbox`
}
