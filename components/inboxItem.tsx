import { Comment, Reply, User } from '@prisma/client'
import { InboxItem } from 'lib/inbox'
import { RenderedMarkdown } from 'lib/markdown'
import { replyRoute, userRoute } from 'lib/routes'
import Link from 'next/link'
import { BiLink } from 'react-icons/bi'
import ReactTimeAgo from 'react-time-ago'
import { Gravatar } from './gravatar'

function AuthorPic(props: { author: Pick<User, 'id' | 'email'> | null }) {
  return (
    props.author
      ?
      <Link href={userRoute(props.author.id)}>
        <a><Gravatar email={props.author.email} size="small" /></a>
      </Link>
      :
      <Gravatar email="" size="small" />
  )
}

export function InboxItemComponent(props: { item: InboxItem }) {
  const { item } = props
  const author = item.author
  return (
    <div className="woc-inbox-item woc-inbox-item-reply d-flex">
      <div className="flex-shrink-0">
        <AuthorPic author={author} />
      </div>
      <div className="flex-grow-1 ms-2">
        <strong>
          {author
            ?
            <Link href={userRoute(author.id)}>
              <a>{author.displayName}</a>
            </Link>
            :
            "[deleted]"
          }
          {/* TODO show the card title */}
        </strong>
        <div>
          <span className="text-muted small">
            <Link href={replyRoute({ cardId: item.comment.cardId, replyId: item.id })}>
              <a className="d-flex align-items-center">
                <BiLink className="me-1" />
                <ReactTimeAgo timeStyle="twitter-minute-now" date={item.createdAt} />
              </a>
            </Link>
          </span>
          {/* TODO when private lockIcon */}
        </div>
        <RenderedMarkdown className="rendered-content mt-1" markdown={item.content} />
      </div>
    </div>
  )
}
