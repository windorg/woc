import type * as GQL from 'generated/graphql/graphql'
import * as B from 'react-bootstrap'
import TextareaAutosize from 'react-textarea-autosize'
import React, { useRef } from 'react'
import { Formik } from 'formik'
import styles from './shared.module.scss'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { evictCardChildren } from '@lib/graphql/cache'

const useCreateCard = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation createCard($parentId: UUID!, $title: String!, $private: Boolean!) {
        createCard(parentId: $parentId, title: $title, private: $private) {
          id
        }
      }
    `),
    {
      update: (cache, { data }, { variables }) => {
        evictCardChildren(cache, { cardId: variables!.parentId })
      },
    }
  )
  return { do: action, result }
}

export function AddCardForm(props: { parentId: GQL.Card['id'] }) {
  const [focused, setFocused] = React.useState(false)
  const inputRef: React.RefObject<HTMLTextAreaElement> = useRef(null)
  const createCardMutation = useCreateCard()
  return (
    <Formik
      initialValues={{
        title: '',
        private: false,
      }}
      onSubmit={async (values, formik) => {
        // TODO: what exactly will happen in prod if the backend fails with err500 for whatever reason?
        await createCardMutation.do({ variables: { parentId: props.parentId, ...values } })
        formik.resetForm()
        inputRef.current!.blur()
        setFocused(false)
      }}
    >
      {(formik) => {
        const onCancel = () => {
          formik.resetForm()
          inputRef.current!.blur()
          setFocused(false)
        }
        return (
          <B.Form
            className={`${styles.addCardForm} ${focused ? styles._focused : ''}`}
            onSubmit={formik.handleSubmit}
            onAbort={onCancel}
          >
            <B.Form.Control
              ref={inputRef}
              onFocus={() => setFocused(true)}
              onKeyDown={async (event) => {
                if (event.key === 'Escape') onCancel()
                if (event.key === 'Enter' && !formik.isSubmitting) {
                  event.preventDefault()
                  await formik.submitForm()
                }
              }}
              as={TextareaAutosize}
              name="title"
              id="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              type="text"
              placeholder="New card..."
            />
            <div className={styles._controls}>
              <B.Form.Check
                name="private"
                id="private"
                checked={formik.values.private}
                onChange={formik.handleChange}
                type="checkbox"
                inline
                label="🔒 Private card"
              />
              <span>
                <B.Button size="sm" className="me-2" variant="secondary" onClick={onCancel}>
                  Cancel
                </B.Button>
                <B.Button size="sm" variant="primary" type="submit" disabled={formik.isSubmitting}>
                  Add a card
                  {formik.isSubmitting && (
                    <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
                  )}
                </B.Button>
              </span>
            </div>
          </B.Form>
        )
      }}
    </Formik>
  )
}
