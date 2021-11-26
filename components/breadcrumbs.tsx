import { Board, User } from "@prisma/client";
import React from "react";
import { Breadcrumb } from "react-bootstrap";
import { boardSettings, checkPrivate } from "../lib/model-settings";
import Link from 'next/link'

function LinkItem(props) {
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
    <LinkItem active={props.active} href={`/ShowUser?id=${props.user.id}`}>
      <em>@{props.user.handle}</em>
    </LinkItem>
  )
}

export function BoardCrumb(props: { active?: boolean, board: Board }) {
  const isPrivate = checkPrivate(boardSettings(props.board).visibility)
  return (
    <LinkItem active={props.active} href={`/ShowBoard?id=${props.board.id}`}>
      {isPrivate ? "🔒 " : ""}
      {props.board.title}
    </LinkItem>
  )
}