import { Board } from "@prisma/client"
import { Formik } from "formik"
import * as B from 'react-bootstrap'
import React from "react"
import { useUpdateBoard } from "lib/queries/board"

export function EditBoardModal(props: {
  board: Board
  show: boolean
  onHide: () => void
  afterBoardUpdated: () => void
}) {
  const titleInputRef = React.useRef<HTMLInputElement>(null)
  const { board } = props
  const updateBoardMutation = useUpdateBoard()
  return (
    <B.Modal
      size="lg"
      show={props.show}
      onHide={props.onHide}
      onEntered={() => titleInputRef.current!.focus()}
    >
      <B.Modal.Header closeButton>
        <B.Modal.Title>Edit board</B.Modal.Title>
      </B.Modal.Header>
      <B.Modal.Body>
        <Formik
          initialValues={{ title: board.title }}
          onSubmit={async (values, formik) => {
            await updateBoardMutation.mutateAsync({ boardId: board.id, ...values })
            props.afterBoardUpdated()
            formik.resetForm()
          }}
        >
          {formik => (<>
            <B.Form onSubmit={formik.handleSubmit}>
              <B.Form.Group className="mb-3">
                <B.Form.Control
                  name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
                  type="text" placeholder="Board title" ref={titleInputRef} />
              </B.Form.Group>
              <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                Save
                {formik.isSubmitting &&
                  <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
              </B.Button>
              <B.Button className="ms-2" variant="secondary" type="button"
                onClick={props.onHide}>
                Cancel
              </B.Button>
            </B.Form>
          </>)}
        </Formik>
      </B.Modal.Body>
    </B.Modal>
  )
}