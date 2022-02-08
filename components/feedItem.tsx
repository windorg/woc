import type { Card, Comment, User } from '@prisma/client'
import { LinkPreload } from 'lib/link-preload'
import { RenderedMarkdown } from 'lib/markdown'
import { commentRoute, userRoute } from 'lib/routes'
import Link from 'next/link'
import { FeedItem } from 'pages/api/feed/get'
import { BiLink } from 'react-icons/bi'
import ReactTimeAgo from 'react-time-ago'
import { Gravatar } from './gravatar'

export function FeedItemComponent(props: { item: FeedItem }) {
  const { item } = props
  const author = item.owner
  return (
    <div className="woc-feed-item woc-feed-item-comment d-flex">
      <div className="flex-shrink-0">
        <LinkPreload href={userRoute(author.id)}>
          <a><Gravatar email={author.email} size="small" /></a>
        </LinkPreload>
      </div>
      <div className="flex-grow-1 ms-2">
        <strong>
          <LinkPreload href={userRoute(author.id)}>
            <a>{author.displayName}</a>
          </LinkPreload>
          {" "}at ‘{item.card.title}’
        </strong>
        <div>
          <span className="text-muted small">
            <LinkPreload href={commentRoute({ cardId: item.cardId, commentId: item.id })}>
              <a className="d-flex align-items-center">
                <BiLink className="me-1" />
                <ReactTimeAgo timeStyle="twitter-minute-now" date={item.createdAt} />
              </a>
            </LinkPreload>
          </span>
          {/* TODO when private lockIcon */}
        </div>
        <RenderedMarkdown className="woc-feed-item-content rendered-content mt-1" markdown={item.content} />
      </div>
    </div>
  )
}
