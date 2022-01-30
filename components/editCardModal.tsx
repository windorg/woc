import { Card } from "@prisma/client"
import { Formik } from "formik"
import { cardSettings } from "lib/model-settings"
import React from "react"
import * as B from 'react-bootstrap'
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"
import Form from "react-bootstrap/Form"
import { useUpdateCard } from "lib/queries/cards"

export function EditCardModal(props: {
  card: Card
  show: boolean
  onHide: () => void
  afterSave?: () => void
}) {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  const titleInputRef: React.RefObject<HTMLInputElement> = React.useRef(null)
  const updateCardMutation = useUpdateCard()
  const { card } = props
  return (
    <Modal
      size="lg"
      show={props.show}
      onHide={props.onHide}
      onEntered={() => titleInputRef.current!.focus()}
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit card</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Formik
          initialValues={{ title: card.title, reverseOrder: cardSettings(card).reverseOrder }}
          onSubmit={async (values, formik) => {
            await updateCardMutation.mutateAsync({ cardId: card.id, ...values })
            if (props.afterSave) props.afterSave()
            formik.resetForm()
          }}
        >
          {formik => (<>
            <Form onSubmit={formik.handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
                  type="text" placeholder="Card title" ref={titleInputRef} />
              </Form.Group>
              <Form.Check name="reverseOrder" id="reverseOrder" className="mb-3">
                <Form.Check.Input
                  name="reverseOrder" id="reverseOrder"
                  checked={formik.values.reverseOrder}
                  onChange={formik.handleChange} type="checkbox" />
                <Form.Check.Label>
                  Show comments in reverse order<br />
                  <span className="text-muted small">
                    Good for cards that work like blog posts. Or maybe you just really like the reverse order.
                  </span>
                </Form.Check.Label>
              </Form.Check>
              <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                Save
                {formik.isSubmitting &&
                  <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
              </Button>
              <Button className="ms-2" variant="secondary" type="button"
                onClick={props.onHide}>
                Cancel
              </Button>
            </Form>
          </>)}
        </Formik>
      </Modal.Body>
    </Modal>
  )
}