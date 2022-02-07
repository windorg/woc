import * as B from 'react-bootstrap'
import React from 'react'
import { BiCheck } from 'react-icons/bi'
import { LinkButton } from './linkButton'
import { InboxItem } from 'lib/inbox'
import { useMarkAsRead } from 'lib/queries/inbox'

function ButtonMarkAsRead(props: { onMarkAsRead }) {
  return <LinkButton onClick={props.onMarkAsRead} icon={<BiCheck />}>Mark as read</LinkButton>
}

export function InboxItemActions(props: {
  inboxItem: InboxItem
}) {
  const { inboxItem } = props

  const markAsReadMutation = useMarkAsRead()
  const markAsRead = async () => {
    await markAsReadMutation.mutateAsync({ subscriptionUpdateId: inboxItem.id })
  }

  return (
    <B.Stack direction="horizontal" gap={4}>
      <ButtonMarkAsRead onMarkAsRead={markAsRead} />
    </B.Stack>
  )
}