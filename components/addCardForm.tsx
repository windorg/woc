import { Board, Card } from '@prisma/client'
import { Button, Form } from 'react-bootstrap'
import * as B from 'react-bootstrap'
import React from 'react'
import { Formik } from 'formik'
import { useCreateCard } from 'lib/queries/board'

export function AddCardForm(props: {
  boardId: Board['id']
}) {
  const createCardMutation = useCreateCard()
  return (
    <Formik
      initialValues={{
        title: '',
        private: false,
      }}
      onSubmit={async (values, formik) => {
        // TODO: what exactly will happen in prod if the backend fails with err500 for whatever reason?
        await createCardMutation.mutateAsync({ boardId: props.boardId, ...values })
        formik.resetForm()
      }}
    >
      {formik => (
        <Form onSubmit={formik.handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Control
              name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
              type="text" placeholder="Card title"
              style={{ maxWidth: "40rem", width: "100%" }} />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            Add a card
            {formik.isSubmitting &&
              <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
          </Button>
          <Form.Check
            name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
            type="checkbox" className="ms-4" inline label="🔒 Private card" />
        </Form>
      )}
    </Formik>
  )
}
