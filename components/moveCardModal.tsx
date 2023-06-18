import type * as GQL from 'generated/graphql/graphql'
import { Formik } from 'formik'
import React from 'react'
import * as B from 'react-bootstrap'
import { Typeahead } from 'react-bootstrap-typeahead'
import { deleteById } from '@lib/array'
import { graphql } from 'generated/graphql'
import { useMutation, useQuery } from '@apollo/client'
import { P, match } from 'ts-pattern'
import { useSession } from 'next-auth/react'
import { evictCardChildren } from '@lib/graphql/cache'

const _getCards = graphql(`
  query getCards($userId: UUID!) {
    user(id: $userId) {
      id
      allCards {
        id
        title
      }
    }
  }
`)

const useMoveCard = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation moveCard($id: UUID!, $newParentId: UUID) {
        moveCard(id: $id, newParentId: $newParentId) {
          card {
            id
            ownerId
            parentChain
          }
          oldParent {
            id
          }
          newParent {
            id
          }
        }
      }
    `),
    {
      update(cache, { data }) {
        const oldParentId = data!.moveCard.oldParent?.id || null
        const newParentId = data!.moveCard.newParent?.id || null
        const ownerId = data!.moveCard.card.ownerId
        // TODO: this will break if we ever allow moving cards between users
        evictCardChildren(cache, { cardId: oldParentId, ownerId })
        evictCardChildren(cache, { cardId: newParentId, ownerId })
      },
    }
  )
  return { do: action, result }
}

export function MoveCardModal(props: {
  card: Pick<GQL.Card, 'id' | 'parentId'>
  show: boolean
  onHide: () => void
  afterMove?: () => void
}) {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  const searchRef = React.useRef<React.ElementRef<typeof Typeahead>>(null)
  const session = useSession().data
  const getCardsQuery = useQuery(_getCards, {
    variables: { userId: session?.userId || '' },
    skip: !session,
  })
  const moveCardMutation = useMoveCard()

  const hide = () => {
    moveCardMutation.result.reset()
    props.onHide()
  }

  // Note: here's how the search box works.
  //
  // The Formik field 'newParent' holds either the selected card (as an object) or the entered text
  // if it doesn't correspond to any card yet. 'onChange' is only called when a card is selected.
  // 'onTextChange' is called when text is typed. We don't allow submitting the form unless the
  // selected object is actually an object (a card).

  const { card } = props

  const formId = React.useId()

  return (
    <B.Modal size="lg" backdrop="static" keyboard={false} show={props.show} onHide={hide}>
      <B.Modal.Header closeButton>
        <B.Modal.Title>Move card</B.Modal.Title>
      </B.Modal.Header>
      <B.Modal.Body>
        <Formik
          initialValues={{
            newParent: '' as Pick<GQL.Card, 'id'> | string,
            moveToTopLevel: false,
          }}
          onSubmit={async (values, formik) => {
            await moveCardMutation.do({
              variables: {
                id: card.id,
                newParentId: values.moveToTopLevel
                  ? null
                  : (values.newParent as Pick<GQL.Card, 'id'>).id,
              },
            })
            if (props.afterMove) props.afterMove()
            searchRef.current?.clear()
            formik.resetForm()
          }}
        >
          {(formik) => {
            // https://codesandbox.io/s/react-typeahead-formik-bootstrap-w3k7k?file=/src/App.js
            const searchBox = match(getCardsQuery)
              .with({ error: P.select(P.not(P.nullish)) }, (error) => (
                <div className="text-danger">Could not fetch cards: {error.message}</div>
              ))
              .with({ data: P.nullish }, () => <B.Spinner animation="border" role="status" />)
              .with({ data: P.select(P.not(P.nullish)) }, (data) => (
                /* TODO: try Typeahead.isLoading=true instead of blocking the whole search box */
                <Typeahead
                  id="newParent"
                  labelKey="title"
                  disabled={formik.values.moveToTopLevel}
                  options={deleteById(data.user.allCards, [card.id, card.parentId])}
                  onChange={(selected) =>
                    void formik.setFieldValue('newParent', selected.length > 0 ? selected[0] : '')
                  }
                  onInputChange={(text) => void formik.setFieldValue('newParent', text)}
                  ref={searchRef}
                />
              ))
              .otherwise(() => 'Impossible')

            return (
              <B.Form onSubmit={formik.handleSubmit}>
                <B.Form.Group className="mb-3">
                  <B.Form.Label>Card to move into</B.Form.Label>
                  {searchBox}
                </B.Form.Group>

                <B.Form.Check className="mb-3" name="moveToTopLevel" id="moveToTopLevel">
                  <B.Form.Check.Input
                    name="moveToTopLevel"
                    id={`moveToTopLevel-${formId}`}
                    checked={formik.values.moveToTopLevel}
                    disabled={card.parentId === null}
                    onChange={formik.handleChange}
                    type="checkbox"
                  />
                  <B.Form.Check.Label>Move the card to top-level</B.Form.Check.Label>
                </B.Form.Check>

                {moveCardMutation.result.error && (
                  <div className="text-danger mb-3">{moveCardMutation.result.error.message}</div>
                )}

                <B.Button
                  variant="primary"
                  type="submit"
                  disabled={
                    formik.isSubmitting ||
                    (formik.values.moveToTopLevel === false &&
                      (typeof formik.values.newParent !== 'object' ||
                        formik.values.newParent.id === card.parentId)) ||
                    (formik.values.moveToTopLevel === true && card.parentId === null)
                  }
                >
                  Move
                  {formik.isSubmitting && (
                    <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
                  )}
                </B.Button>

                <B.Button className="ms-2" variant="secondary" type="button" onClick={hide}>
                  Cancel
                </B.Button>
              </B.Form>
            )
          }}
        </Formik>
      </B.Modal.Body>
    </B.Modal>
  )
}
