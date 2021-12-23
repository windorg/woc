import { Board } from "@prisma/client"
import { Formik } from "formik"
import { boardSettings } from "lib/model-settings"
import { callUpdateBoard } from "pages/api/boards/update"
import React from "react"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"
import Form from "react-bootstrap/Form"

export class EditBoardModal extends React.Component<{
  board: Board
  show: boolean
  onHide: () => void
  afterBoardUpdated: (newBoard: Board) => void
}> {
  #titleInputRef: React.RefObject<HTMLInputElement> = React.createRef()

  render() {
    const { board } = this.props
    return (
      <Modal
        size="lg"
        show={this.props.show}
        onHide={this.props.onHide}
        onEntered={() => this.#titleInputRef.current!.focus()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit board</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{ title: board.title }}
            onSubmit={async (values) => {
              const diff = await callUpdateBoard({ boardId: board.id, ...values })
              this.props.afterBoardUpdated({ ...board, ...diff })
            }}
          >
            {formik => (<>
              <Form onSubmit={formik.handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
                    type="text" placeholder="Board title" ref={this.#titleInputRef} />
                </Form.Group>
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