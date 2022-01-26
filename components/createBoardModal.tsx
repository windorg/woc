import React, { useRef } from 'react'
import * as B from 'react-bootstrap'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { Formik } from 'formik'
import { useCreateBoard } from 'lib/queries/boards'

export function CreateBoardModal(props: {
  show: boolean
  onHide: () => void
  afterBoardCreated: () => void
}) {
  const titleInputRef: React.RefObject<HTMLInputElement> = useRef(null)
  const createBoardMutation = useCreateBoard()
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
          onSubmit={async (values, formik) => {
            await createBoardMutation.mutateAsync(values)
            props.afterBoardCreated()
            formik.resetForm()
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
              <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                Create a board
                {formik.isSubmitting &&
                  <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
              </Button>
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
