import { Card } from '@prisma/client'
import * as B from 'react-bootstrap'
import TextareaAutosize from 'react-textarea-autosize'
import React, { useRef } from 'react'
import { Formik } from 'formik'
import { useCreateCard } from 'lib/queries/cards'
import styles from './shared.module.scss'

export function AddCardForm(props: {
  parentId: Card['id']
}) {
  const createCardMutation = useCreateCard()
  const [focused, setFocused] = React.useState(false)
  const inputRef: React.RefObject<HTMLTextAreaElement> = useRef(null)
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
        inputRef.current!.blur()
        setFocused(false)
      }}
    >
      {formik => {
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
              onKeyDown={async event => {
                if (event.key === 'Escape') onCancel()
                if (event.key === 'Enter' && !formik.isSubmitting) {
                  event.preventDefault()
                  await formik.submitForm()
                }
              }}
              as={TextareaAutosize}
              name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
              type="text" placeholder="New card..." />
            <div className={styles._controls}>
              <B.Form.Check
                name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
                type="checkbox" inline label="🔒 Private card" />
              <span>
                <B.Button size="sm" className="me-2" variant="secondary"
                  onClick={onCancel}
                >
                  Cancel
                </B.Button>
                <B.Button size="sm" variant="primary" type="submit" disabled={formik.isSubmitting}>
                  Add a card
                  {formik.isSubmitting &&
                    <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
                </B.Button>
              </span>
            </div>
          </B.Form>
        )
      }}
    </Formik >
  )
}
