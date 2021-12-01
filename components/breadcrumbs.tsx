import { Board, Card, User } from "@prisma/client"
import React from "react"
import { Breadcrumb } from "react-bootstrap"
import { boardSettings } from "../lib/model-settings"
import Link from 'next/link'

function LinkItem(props: React.ComponentProps<typeof Link> & { active?: boolean }) {
  return props.active
    ? (<Breadcrumb.Item active>{props.children}</Breadcrumb.Item>)
    : (<Link href={props.href} passHref><Breadcrumb.Item>{props.children}</Breadcrumb.Item></Link>)
}

export function BoardsCrumb(props: { active?: boolean }) {
  return (
    <LinkItem active={props.active} href={`/Boards`}>
      Boards
    </LinkItem>
  )
}

export function UserCrumb(props: { active?: boolean, user: User }) {
  return (
    <LinkItem active={props.active} href={`/ShowUser?userId=${props.user.id}`}>
      <em>@{props.user.handle}</em>
    </LinkItem>
  )
}

export function BoardCrumb(props: { active?: boolean, board: Board }) {
  const isPrivate = boardSettings(props.board).visibility === 'private'
  return (
    <LinkItem active={props.active} href={`/ShowBoard?boardId=${props.board.id}`}>
      {isPrivate ? "🔒 " : ""}
      {props.board.title}
    </LinkItem>
  )
}

export function CardCrumb(props: { active?: boolean, card: Card }) {
  const isPrivate = boardSettings(props.card).visibility === 'private'
  return (
    <LinkItem active={props.active} href={`/ShowCard?cardId=${props.card.id}`}>
      {isPrivate ? "🔒 " : ""}
      {props.card.title}
    </LinkItem>
  )
}