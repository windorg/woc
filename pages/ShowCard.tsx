import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment, Reply } from '@prisma/client'
import { prisma } from '../lib/db'
import { cardSettings, commentSettings } from '../lib/model-settings'
import { Badge, Breadcrumb } from 'react-bootstrap'
import { BoardsCrumb, UserCrumb, BoardCrumb, CardCrumb } from '../components/breadcrumbs'
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import * as R from 'ramda'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { canDeleteReply, canEditCard, canEditReply, CanSee, canSeeBoard, canSeeCard, canSeeComment, canSeeReply, pCardSelect, unsafeCanSee } from 'lib/access'
import { getSession } from 'next-auth/react'
import { CommentComponent, Comment_ } from 'components/commentComponent'
import { EditCardModal } from 'components/editCardModal'
import { CardMenu } from 'components/cardMenu'
import { BiPencil } from 'react-icons/bi'
import { useRouter } from 'next/router'
import { Reply_ } from 'components/replyComponent'
import { deleteById, filterSync, mapAsync, mergeById, updateById } from 'lib/array'
import { LinkButton } from 'components/linkButton'
import { boardRoute } from 'lib/routes'
import assert from 'assert'
import { AddCommentForm } from '../components/addCommentForm'

type Card_ = CanSee & Card & {
  owner: Pick<User, 'id' | 'displayName' | 'handle'>
  // TODO: honestly we only need the title from here.
  board: CanSee & Board
  comments: (CanSee & Comment_ & { replies: (CanSee & Reply_)[] })[]
  canEdit: boolean
}

type Props = {
  initialCard: Card_
}

const cardFindSettings = {
  include: {
    owner: { select: { id: true, displayName: true, handle: true } },
    board: true,
    comments: {
      include: {
        replies: {
          include: {
            author: { select: { id: true, email: true, displayName: true } }
          }
        }
      }
    }
  }
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  const userId = session?.userId
  const card = await prisma.card.findUnique({
    where: {
      id: context.query.cardId as string
    },
    ...cardFindSettings
  })
  if (!card || !canSeeCard(userId, card)) { return { notFound: true } }
  const canEditCard_ = await canEditCard(userId, card)

  // We assume that if you can see the card, you can see the board. For now (Jan 2022) it is always true.
  const board = card.board
  // NB: we can't write canSeeBoard(userId, card.board) because it wouldn't refine the type of card.board, so we have to
  // work around like this.
  assert(canSeeBoard(userId, board))

  const card_: Card_ = {
    ...card,
    board,
    canEdit: canEditCard_,
    comments: await mapAsync(
      filterSync(card.comments, (comment): comment is (typeof comment & CanSee) => canSeeComment(userId, { ...comment, card })),
      async comment => ({
        ...comment,
        // Augment comments with "canEdit". For speed we assume that if you can edit the card, you can edit the comments
        canEdit: canEditCard_,
        replies: await mapAsync(
          filterSync(comment.replies, (reply): reply is (typeof reply & CanSee) => canSeeReply(userId, { ...reply, comment: { ...comment, card } })),
          async reply => ({
            ...reply,
            // Augment replies with "canEdit" and "canDelete"
            canEdit: await canEditReply(session?.userId, { ...reply, comment: { ...comment, card } }),
            canDelete: await canDeleteReply(session?.userId, { ...reply, comment: { ...comment, card } })
          }))
      }))
  }

  const props: Props = {
    initialCard: card_
  }
  return {
    props: serialize(props)
  }
}

const ShowCard: NextPage<SuperJSONResult> = (props) => {
  const { initialCard } = deserialize<Props>(props)

  // Card state & card-modifying methods
  const [card, setCard] = useState(initialCard)

  // Assuming that this is only called for own comments (and therefore they can be edited). Shouldn't be called for
  // e.g. comments coming from a websocket
  const addComment = (comment: Comment) => setCard(card => {
    // Of course you can see your own comments
    const comment_ = unsafeCanSee({ ...comment, replies: [], canEdit: true })
    return {
      ...card,
      comments: card.comments.concat([comment_])
    }
  })

  const updateComment = (comment: Comment) => setCard(card => ({
    ...card,
    comments: mergeById(card.comments, comment)
  }))

  const deleteComment = (commentId) => setCard(card => ({
    ...card,
    comments: deleteById(card.comments, commentId)
  }))

  const addReply = (commentId, reply: Reply_) => setCard(card => {
    // Of course you can see your own replies
    const reply_ = unsafeCanSee(reply)
    return {
      ...card,
      comments: updateById(card.comments, commentId, (comment => ({
        ...comment,
        replies: comment.replies.concat([reply_])
      })))
    }
  })

  const updateReply = (commentId, reply: Reply) => setCard(card => ({
    ...card,
    comments: updateById(card.comments, commentId, (comment => ({
      ...comment,
      replies: mergeById(comment.replies, reply)
    })))
  }))

  const deleteReply = (commentId, replyId) => setCard(card => ({
    ...card,
    comments: updateById(card.comments, commentId, (comment => ({
      ...comment,
      replies: deleteById(comment.replies, replyId)
    })))
  }))

  const [editCardShown, setEditCardShown] = useState(false)

  const renderCommentList = (comments) => comments.map(comment => (
    <CommentComponent key={comment.id}
      card={card}
      comment={{ ...comment, canEdit: card.canEdit }}
      replies={comment.replies}
      afterCommentUpdated={updateComment}
      afterCommentDeleted={() => deleteComment(comment.id)}
      afterReplyCreated={reply => addReply(comment.id, reply)}
      afterReplyUpdated={reply => updateReply(comment.id, reply)}
      afterReplyDeleted={replyId => deleteReply(comment.id, replyId)}
    />
  ))

  const settings = cardSettings(card)
  const isPrivate = settings.visibility === 'private'

  const [pinnedComments, otherComments] =
    _.partition(
      _.orderBy(card.comments, ['createdAt'], ['desc']),
      comment => commentSettings(comment).pinned)

  const reverseOrderComments = () => (<>
    <p className="text-muted small">Comment order: oldest to newest.</p>
    <div className="mb-3">
      {renderCommentList(_.concat(R.reverse(pinnedComments), R.reverse(otherComments)))}
    </div>
    {card.canEdit && <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />}
  </>)
  const normalOrderComments = () => (<>
    {card.canEdit && <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />}
    <div className="mt-4">
      {renderCommentList(_.concat(pinnedComments, otherComments))}
    </div>
  </>)

  const router = useRouter()

  const moreButton = () => (
    <CardMenu
      card={card}
      afterCardUpdated={card => setCard(prev => ({ ...prev, ...card }))}
      afterCardDeleted={async () => router.replace(boardRoute(card.boardId))} />
  )

  return (
    <>
      <Head>
        {/* TODO OG/Twitter tags */}
        <title>{card.title} / WOC</title>
      </Head>

      <Breadcrumb>
        <BoardsCrumb />
        <UserCrumb user={card.owner} />
        <BoardCrumb board={card.board} />
        <CardCrumb card={card} active />
      </Breadcrumb>

      <h1 className="mb-4">
        {cardSettings(card).archived && <Badge bg="secondary" className="me-2">Archived</Badge>}
        {isPrivate && "🔒 "}
        {card.title}
        {card.canEdit &&
          <EditCardModal
            card={card}
            show={editCardShown}
            onHide={() => setEditCardShown(false)}
            afterCardUpdated={card => {
              setCard(prev => ({ ...prev, ...card }))
              setEditCardShown(false)
            }}
          />
        }
        <span
          className="ms-5"
          style={{ fontSize: "50%" }}
        >
          {card.canEdit && <>
            <LinkButton onClick={() => setEditCardShown(true)} icon={<BiPencil />}>Edit</LinkButton>
            <span className="me-3" />
          </>}
          {moreButton()}
        </span>
      </h1>
      {settings.reverseOrder ? reverseOrderComments() : normalOrderComments()}
    </>
  )
}

export default ShowCard