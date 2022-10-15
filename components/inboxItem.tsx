import { Comment, Reply, User } from '@prisma/client'
import { InboxItem } from 'lib/inbox'
import LinkPreload from 'lib/link-preload'
import { RenderedMarkdown } from 'lib/markdown'
import { replyRoute, userRoute } from 'lib/routes'
import Link from 'next/link'
import { BiLink } from 'react-icons/bi'
import ReactTimeAgo from 'react-time-ago'
import { Gravatar } from './gravatar'
import { InboxItemActions } from './inboxItemActions'

function AuthorPic(props: { author: Pick<User, 'id' | 'email'> | null }) {
  return (
    props.author
      ?
      <LinkPreload href={userRoute(props.author.id)}>
        <a><Gravatar email={props.author.email} size="small" /></a>
      </LinkPreload>
      :
      <Gravatar email="" size="small" />
  )
}

export function InboxItemComponent(props: { item: InboxItem }) {
  const { item } = props
  const author = item.reply.author
  return (
    <div className="woc-inbox-item woc-inbox-item-reply d-flex">
      <div className="flex-shrink-0">
        <AuthorPic author={author} />
      </div>
      <div className="flex-grow-1 ms-2">
        <strong>
          {author
            ?
            <LinkPreload href={userRoute(author.id)}>
              <a>{author.displayName}</a>
            </LinkPreload>
            :
            "[deleted]"
          }
          {" "}replied at ‘{item.reply.comment.card.title}’
        </strong>
        <div>
          <span className="text-muted small">
            <LinkPreload href={replyRoute({ cardId: item.reply.comment.cardId, replyId: item.reply.id })}>
              <a className="d-flex align-items-center">
                <BiLink className="me-1" />
                <ReactTimeAgo timeStyle="twitter-minute-now" date={item.reply.createdAt} />
              </a>
            </LinkPreload>
          </span>
          {/* TODO when private lockIcon */}
        </div>
        <RenderedMarkdown className="rendered-content mt-1" markdown={item.reply.content} />
        <div className='small'>
          <InboxItemActions inboxItem={item} />
        </div>
      </div>
    </div>
  )
}
