import type * as GQL from 'generated/graphql/graphql'
import { filterSync } from '@lib/array'
import { AddCommentForm } from 'components/addCommentForm'
import { CommentComponent } from 'components/commentComponent'
import _ from 'lodash'
import { ListRepliesData } from 'pages/api/replies/list'
import * as R from 'ramda'
import styles from './shared.module.scss'

export function Comments(props: {
  card: Pick<GQL.Card, 'id' | 'canEdit' | 'reverseOrder'>
  comments: Pick<
    GQL.Comment,
    'id' | 'createdAt' | 'pinned' | 'visibility' | 'content' | 'canEdit'
  >[]
  replies: ListRepliesData
}) {
  const { card, comments, replies } = props

  const renderCommentList = (comments: typeof props.comments) =>
    comments.map((comment) => (
      <CommentComponent
        key={comment.id}
        card={card}
        comment={comment}
        replies={filterSync(replies, (reply) => reply.commentId === comment.id)}
      />
    ))

  const [pinnedComments, otherComments] = _.partition(
    _.orderBy(comments, ['createdAt'], ['desc']),
    (comment) => comment.pinned
  )

  // Note: we only use autoFocus for 'normalOrderComments' because for 'reverseOrderComments' it's annoying that the focus always jumps to the end of
  // the page after loading.
  const normalOrderComments = () => (
    <>
      {card.canEdit && <AddCommentForm cardId={card.id} autoFocus />}
      <div className="mt-4">{renderCommentList(_.concat(pinnedComments, otherComments))}</div>
    </>
  )

  const reverseOrderComments = () => (
    <>
      <p className="text-muted small">Comment order: oldest to newest.</p>
      <div className="mb-3">
        {renderCommentList(_.concat(R.reverse(pinnedComments), R.reverse(otherComments)))}
      </div>
      {card.canEdit && <AddCommentForm cardId={card.id} />}
    </>
  )

  return (
    <div className={styles.comments}>
      <div className={styles.sectionHeader}>
        <div className={styles._label}>Comments ({comments.length})</div>
      </div>
      <div className={styles._list}>
        {card.reverseOrder ? reverseOrderComments() : normalOrderComments()}
      </div>
    </div>
  )
}
