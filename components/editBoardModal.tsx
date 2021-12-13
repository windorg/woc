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
  private titleInputRef: React.RefObject<HTMLInputElement>
  constructor(props) {
    super(props)
    this.titleInputRef = React.createRef()
  }
  render() {
    const { board } = this.props
    const isPrivate = boardSettings(board).visibility === 'private'
    return (
      <Modal
        size="lg"
        show={this.props.show}
        onHide={this.props.onHide}
        onEntered={() => this.titleInputRef.current!.focus()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit board</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{ private: isPrivate, title: board.title }}
            onSubmit={async (values) => {
              const diff = await callUpdateBoard({ boardId: board.id, ...values })
              this.props.afterBoardUpdated({ ...board, ...diff })
            }}
          >
            {props => (<>
              <Form onSubmit={props.handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    name="title" id="title" value={props.values.title} onChange={props.handleChange}
                    type="text" placeholder="Board title" ref={this.titleInputRef} />
                </Form.Group>
                <Button variant="primary" type="submit">Save</Button>
                <Button className="ms-2" variant="secondary" type="button"
                  onClick={this.props.onHide}>
                  Cancel
                </Button>
                {/* TODO this should become an action instead */}
                <Form.Check
                  name="private" id="private" checked={props.values.private} onChange={props.handleChange}
                  className="ms-4" type="checkbox" inline label="🔒 Private board" />
              </Form>
            </>)}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }
}