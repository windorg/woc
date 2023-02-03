import React, { useRef } from 'react'
import * as B from 'react-bootstrap'
import { Formik } from 'formik'
import { graphql } from 'generated/graphql'
import { useMutation } from '@apollo/client'
import { evictCardChildren } from '@lib/graphql/cache'

const useCreateTopLevelCard = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation createTopLevelCard($title: String!, $private: Boolean!) {
        createCard(title: $title, private: $private, parentId: null) {
          id
          ownerId
        }
      }
    `),
    {
      update: (cache, { data }, { variables }) => {
        evictCardChildren(cache, { cardId: null, ownerId: data!.createCard.ownerId })
      },
    }
  )
  return { do: action, result }
}

export function CreateBoardModal(props: {
  show: boolean
  onHide: () => void
  afterCreate?: () => void
}) {
  const titleInputRef: React.RefObject<HTMLInputElement> = useRef(null)
  const createTopLevelCardMutation = useCreateTopLevelCard()
  const formId = React.useId()
  return (
    <B.Modal
      size="lg"
      backdrop="static"
      keyboard={false}
      show={props.show}
      onHide={props.onHide}
      onEntered={() => titleInputRef.current!.focus()}
    >
      <B.Modal.Header closeButton>
        <B.Modal.Title>Create a board</B.Modal.Title>
      </B.Modal.Header>
      <B.Modal.Body>
        <Formik
          initialValues={{ private: false, title: '' }}
          onSubmit={async (values, formik) => {
            await createTopLevelCardMutation.do({ variables: { ...values } })
            if (props.afterCreate) props.afterCreate()
            formik.resetForm()
          }}
        >
          {(formik) => (
            <B.Form onSubmit={formik.handleSubmit}>
              <B.Form.Group className="mb-3">
                <B.Form.Control
                  name="title"
                  id={`title-${formId}`}
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  type="text"
                  placeholder="Board title"
                  onKeyDown={async (event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                      await formik.submitForm()
                    }
                  }}
                  ref={titleInputRef}
                />
              </B.Form.Group>
              <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                Create a board
                {formik.isSubmitting && (
                  <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
                )}
              </B.Button>
              <B.Form.Check
                name="private"
                id={`private-${formId}`}
                checked={formik.values.private}
                onChange={formik.handleChange}
                type="checkbox"
                className="ms-4"
                inline
                label="🔒 Private board"
              />
            </B.Form>
          )}
        </Formik>
      </B.Modal.Body>
    </B.Modal>
  )
}
