import { Card, User } from '@prisma/client'
import React from 'react'
import * as B from 'react-bootstrap'
import { cardSettings } from '../lib/model-settings'
import Link from 'next/link'
import { boardsRoute, cardRoute, feedRoute, inboxRoute, userRoute, accountRoute } from 'lib/routes'
import { useCard } from '@lib/queries/cards'

function LinkItem(props: { href: string; children: React.ReactNode; active?: boolean }) {
  return props.active ? (
    <B.Breadcrumb.Item active>{props.children}</B.Breadcrumb.Item>
  ) : (
    <B.Breadcrumb.Item linkAs={Link} href={props.href}>
      <a>{props.children}</a>
    </B.Breadcrumb.Item>
  )
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
    <LinkItem active={props.active} href={feedRoute()}>
      Feed
    </LinkItem>
  )
}

export function InboxCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={inboxRoute()}>
      Inbox
    </LinkItem>
  )
}

export function BoardsCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={boardsRoute()}>
      Boards
    </LinkItem>
  )
}

export function UserCrumb(props: { active?: boolean; user: Pick<User, 'id' | 'handle'> }) {
  return (
    <LinkItem active={props.active} href={userRoute(props.user.id)}>
      <em>@{props.user.handle}</em>
    </LinkItem>
  )
}

export function CardCrumb(props: { active?: boolean; card: Pick<Card, 'id' | 'title' | 'settings'> }) {
  const isPrivate = cardSettings(props.card).visibility === 'private'
  return (
    <LinkItem active={props.active} href={cardRoute(props.card.id)}>
      {isPrivate ? '🔒 ' : ''}
      {props.card.title}
    </LinkItem>
  )
}

export function CardCrumbFetch(props: { active?: boolean; cardId: Card['id'] }) {
  const cardQuery = useCard({ cardId: props.cardId })
  const isPrivate = cardQuery.data ? cardSettings(cardQuery.data).visibility === 'private' : false
  return (
    <LinkItem active={props.active} href={cardRoute(props.cardId)}>
      {cardQuery.data ? (
        <>
          {isPrivate ? '🔒 ' : ''} {cardQuery.data.title}
        </>
      ) : (
        <B.Spinner animation="border" size="sm" />
      )}
    </LinkItem>
  )
}
