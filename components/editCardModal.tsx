import { Card } from "@prisma/client"
import { Formik } from "formik"
import { cardSettings } from "lib/model-settings"
import { callUpdateCard } from "pages/api/cards/update"
import React from "react"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"
import Form from "react-bootstrap/Form"

export class EditCardModal extends React.Component<{
  card: Card
  show: boolean
  onHide: () => void
  afterCardUpdated: (newCard: Card) => void
}> {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  #titleInputRef: React.RefObject<HTMLInputElement> = React.createRef()

  render() {
    const { card } = this.props
    return (
      <Modal
        size="lg"
        show={this.props.show}
        onHide={this.props.onHide}
        onEntered={() => this.#titleInputRef.current!.focus()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit card</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{ title: card.title, reverseOrder: cardSettings(card).reverseOrder }}
            onSubmit={async (values) => {
              const diff = await callUpdateCard({ cardId: card.id, ...values })
              this.props.afterCardUpdated({ ...card, ...diff })
            }}
          >
            {formik => (<>
              <Form onSubmit={formik.handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
                    type="text" placeholder="Card title" ref={this.#titleInputRef} />
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
                <Button variant="primary" type="submit">Save</Button>
                <Button className="ms-2" variant="secondary" type="button"
                  onClick={this.props.onHide}>
                  Cancel
                </Button>
              </Form>
            </>)}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }
}