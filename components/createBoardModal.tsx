import React, { useRef } from 'react'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { Formik } from 'formik'
import { callCreateBoard } from 'pages/api/boards/create'
import { Board } from '@prisma/client'

export function CreateBoardModal(props: {
  show: boolean
  onHide: () => void
  afterBoardCreated: (newBoard: Board) => void
}) {
  const titleInputRef: React.RefObject<HTMLInputElement> = useRef(null)
  return (
    <Modal
      size="lg"
      show={props.show}
      onHide={props.onHide}
      onEntered={() => titleInputRef.current!.focus()}
    >
      <Modal.Header closeButton>
        <Modal.Title>Create a board</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Formik
          initialValues={{ private: false, title: "" }}
          onSubmit={async (values) => {
            const board = await callCreateBoard(values)
            props.afterBoardCreated(board)
          }}
        >
          {formik => (
            <Form onSubmit={formik.handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Control
                  name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
                  type="text" placeholder="Board title"
                  ref={titleInputRef} />
              </Form.Group>
              <Button variant="primary" type="submit">Create a board</Button>
              <Form.Check
                name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
                type="checkbox" className="ms-4" inline label="🔒 Private board" />
            </Form>
          )}
        </Formik>
      </Modal.Body>
    </Modal>
  )
}
