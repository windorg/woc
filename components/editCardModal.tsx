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
            initialValues={{ title: card.title }}
            onSubmit={async (values) => {
              const diff = await callUpdateCard({ cardId: card.id, ...values })
              this.props.afterCardUpdated({ ...card, ...diff })
            }}
          >
            {props => (<>
              <Form onSubmit={props.handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    name="title" id="title" value={props.values.title} onChange={props.handleChange}
                    type="text" placeholder="Card title" ref={this.#titleInputRef} />
                </Form.Group>
                <Button variant="primary" type="submit">Save</Button>
                <Button className="ms-2" variant="secondary" type="button"
                  onClick={this.props.onHide}>
                  Cancel
                </Button>
                {/* TODO reverse order checkbox */}
                {/* <Form.Check
                  name="reverseOrder" id="reverseOrder" checked={props.values.reverseOrder}
                  onChange={props.handleChange}
                  className="ms-4" type="checkbox" inline label="Reverse order" /> */}
              </Form>
            </>)}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }
}