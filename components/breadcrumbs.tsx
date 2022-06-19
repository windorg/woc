import { Card, User } from "@prisma/client"
import React from "react"
import * as B from 'react-bootstrap'
import { cardSettings } from "../lib/model-settings"
import Link from 'next/link'
import { boardRoute, boardsRoute, cardRoute, feedRoute, inboxRoute, userRoute, accountRoute } from "lib/routes"
import { LinkPreload } from "lib/link-preload"

function LinkItem(props: { href: string, children: React.ReactNode, active?: boolean, preload?: boolean }) {
  return props.active
    ? (<B.Breadcrumb.Item active>{props.children}</B.Breadcrumb.Item>)
    : <B.Breadcrumb.Item linkAs={props.preload ? LinkPreload : Link} href={props.href}><a>{props.children}</a></B.Breadcrumb.Item>
}

export function AccountCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={accountRoute()}>
      Your account
    </LinkItem>
  )
}

export function FeedCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={feedRoute()} preload>
      Feed
    </LinkItem>
  )
}

export function InboxCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={inboxRoute()} preload>
      Inbox
    </LinkItem>
  )
}

export function BoardsCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={boardsRoute()} preload>
      Boards
    </LinkItem>
  )
}

export function UserCrumb(props: { active?: boolean, user: Pick<User, 'id' | 'handle'> }) {
  return (
    <LinkItem active={props.active} href={userRoute(props.user.id)} preload>
      <em>@{props.user.handle}</em>
    </LinkItem>
  )
}

export function BoardCrumb(props: { active?: boolean, board: Pick<Card, 'id' | 'title' | 'settings'> }) {
  const isPrivate = cardSettings(props.board).visibility === 'private'
  return (
    <LinkItem active={props.active} href={boardRoute(props.board.id)} preload>
      {isPrivate ? "🔒 " : ""}
      {props.board.title}
    </LinkItem>
  )
}

export function CardCrumb(props: { active?: boolean, card: Pick<Card, 'id' | 'title' | 'settings'> }) {
  const isPrivate = cardSettings(props.card).visibility === 'private'
  return (
    <LinkItem active={props.active} href={cardRoute(props.card.id)} preload>
      {isPrivate ? "🔒 " : ""}
      {props.card.title}
    </LinkItem>
  )
}