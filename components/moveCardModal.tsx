import { Card } from "@prisma/client"
import { Formik } from "formik"
import { cardSettings } from "lib/model-settings"
import React from "react"
import * as B from 'react-bootstrap'
import { useMoveCard, useCards } from "lib/queries/cards"
import { Typeahead } from 'react-bootstrap-typeahead'
import { useSession } from "next-auth/react"
import { deleteById } from "@lib/array"

export function MoveCardModal(props: {
  card: Card
  show: boolean
  onHide: () => void
  afterMove?: () => void
}) {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  const searchRef = React.useRef<React.ElementRef<typeof Typeahead>>(null)
  const session = useSession().data!  // assuming there's definitely a user
  const cardsQuery = useCards({ owners: [session.userId] })
  const moveCardMutation = useMoveCard()

  const hide = () => {
    moveCardMutation.reset()
    props.onHide()
  }

  // Note: here's how the search box works.
  //
  // The Formik field 'newParent' holds either the selected card (as an object) or the entered text if it doesn't
  // correspond to any card yet. 'onChange' is only called when a card is selected. 'onTextChange' is called when text
  // is typed. We don't allow submitting the form unless the selected object is actually an object (a card).

  const { card } = props
  return (
    <B.Modal
      size="lg"
      backdrop="static"
      keyboard={false}
      show={props.show}
      onHide={hide}
      onEntered={() => searchRef.current?.focus()}
    >
      <B.Modal.Header closeButton>
        <B.Modal.Title>Move card</B.Modal.Title>
      </B.Modal.Header>
      <B.Modal.Body>
        <Formik
          initialValues={{ newParent: '' as Card | string }}
          onSubmit={async (values, formik) => {
            // We are allowed to use "as" because we disable the submit button unless the chosen value is an object
            await moveCardMutation.mutateAsync({ cardId: card.id, newParentId: (values.newParent as Card).id })
            if (props.afterMove) props.afterMove()
            searchRef.current?.clear()
            formik.resetForm()
          }}
        >
          {formik => (<>
            <B.Form onSubmit={formik.handleSubmit}>
              <B.Form.Group className="mb-3">
                <B.Form.Label>Card to move into</B.Form.Label>
                {/* https://codesandbox.io/s/react-typeahead-formik-bootstrap-w3k7k?file=/src/App.js */}
                {(cardsQuery.isLoading || cardsQuery.isIdle) ? <B.Spinner animation="border" role="status" /> :
                  cardsQuery.isError ? <div className="text-danger">Could not fetch boards: {(cardsQuery.error as Error).message}</div> :
                    /* TODO: try Typeahead.isLoading=true instead of blocking the whole search box */
                    <Typeahead
                      id="newParent"
                      labelKey="title"
                      options={deleteById(cardsQuery.data, [card.id, card.parentId])}
                      onChange={selected => formik.setFieldValue('newParent', selected.length > 0 ? selected[0] : "")}
                      onInputChange={text => formik.setFieldValue('newParent', text)}
                      ref={searchRef}
                    />
                }
              </B.Form.Group>
              {moveCardMutation.error && <div className="text-danger mb-3">{(moveCardMutation.error as Error).message}</div>}
              <B.Button variant="primary" type="submit"
                disabled={formik.isSubmitting || typeof formik.values.newParent !== 'object' || formik.values.newParent.id === card.parentId}
              >
                Move
                {formik.isSubmitting &&
                  <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
              </B.Button>
              <B.Button className="ms-2" variant="secondary" type="button"
                onClick={hide}>
                Cancel
              </B.Button>
            </B.Form>
          </>)}
        </Formik>
      </B.Modal.Body>
    </B.Modal>
  )
}