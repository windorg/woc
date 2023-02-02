import React from 'react'
import * as B from 'react-bootstrap'
import Link from 'next/link'
import { boardsRoute, cardRoute, feedRoute, inboxRoute, userRoute, accountRoute } from 'lib/routes'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'
import type * as GQL from 'generated/graphql/graphql'
import { Visibility } from '@lib/graphql/schema/visibility'

function LinkItem(props: { href: string; children: React.ReactNode; active?: boolean }) {
  return props.active ? (
    <B.Breadcrumb.Item active>{props.children}</B.Breadcrumb.Item>
  ) : (
    <B.Breadcrumb.Item linkAs={Link} href={props.href}>
      {props.children}
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

export function UserCrumb(props: { active?: boolean; user: Pick<GQL.User, 'id' | 'handle'> }) {
  return (
    <LinkItem active={props.active} href={userRoute(props.user.id)}>
      <em>@{props.user.handle}</em>
    </LinkItem>
  )
}

export function CardCrumb(props: {
  active?: boolean
  card: Pick<GQL.Card, 'id' | 'title' | 'visibility'>
}) {
  const isPrivate = props.card.visibility === Visibility.Private
  return (
    <LinkItem active={props.active} href={cardRoute(props.card.id)}>
      {isPrivate ? '🔒 ' : ''}
      {props.card.title}
    </LinkItem>
  )
}

const _getCardInfo = graphql(`
  query getCardInfo($id: UUID!) {
    card(id: $id) {
      title
      visibility
    }
  }
`)

export function CardCrumbFetch(props: { active?: boolean; cardId: GQL.Card['id'] }) {
  const card = useQuery(_getCardInfo, { variables: { id: props.cardId } }).data?.card
  const isPrivate = card ? card.visibility === Visibility.Private : false
  return (
    <LinkItem active={props.active} href={cardRoute(props.cardId)}>
      {card ? (
        <>
          {isPrivate ? '🔒 ' : ''} {card.title}
        </>
      ) : (
        <B.Spinner animation="border" size="sm" />
      )}
    </LinkItem>
  )
}
