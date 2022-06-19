import { Card } from '@prisma/client'
import * as B from 'react-bootstrap'
import React from 'react'
import { Formik } from 'formik'
import { useCreateCard } from 'lib/queries/cards'

export function AddCardForm(props: {
  parentId: Card['id']
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
        await createCardMutation.mutateAsync({ parentId: props.parentId, ...values })
        formik.resetForm()
      }}
    >
      {formik => (
        <B.Form onSubmit={formik.handleSubmit}>
          <B.Form.Group className="mb-3">
            <B.Form.Control
              name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
              type="text" placeholder="Card title"
              style={{ maxWidth: "40rem", width: "100%" }} />
          </B.Form.Group>
          <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            Add a card
            {formik.isSubmitting &&
              <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
          </B.Button>
          <B.Form.Check
            name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
            type="checkbox" className="ms-4" inline label="🔒 Private card" />
        </B.Form>
      )}
    </Formik>
  )
}
