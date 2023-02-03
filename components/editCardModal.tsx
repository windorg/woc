import type * as GQL from 'generated/graphql/graphql'
import { Formik } from 'formik'
import React from 'react'
import * as B from 'react-bootstrap'
import Link from 'next/link'
import { accountRoute } from 'lib/routes'
import { graphql } from 'generated/graphql'
import { useMutation } from '@apollo/client'

const _updateCard_EditCardModal = graphql(`
  mutation updateCard_EditCardModal(
    $id: UUID!
    $title: String
    $tagline: String
    $reverseOrder: Boolean
    $beeminderGoal: String
  ) {
    updateCard(
      input: {
        id: $id
        title: $title
        tagline: $tagline
        reverseOrder: $reverseOrder
        beeminderGoal: $beeminderGoal
      }
    ) {
      card {
        id
        title
        tagline
        reverseOrder
        beeminderGoal
      }
    }
  }
`)

export function EditCardModal(props: {
  card: Pick<GQL.Card, 'id' | 'title' | 'tagline' | 'reverseOrder' | 'beeminderGoal'>
  show: boolean
  onHide: () => void
  afterSave?: () => void
}) {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  const titleInputRef: React.RefObject<HTMLInputElement> = React.useRef(null)
  const [updateCard, updateCardMutation] = useMutation(_updateCard_EditCardModal)
  const { card } = props

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
        <B.Modal.Title>Edit card</B.Modal.Title>
      </B.Modal.Header>
      <B.Modal.Body>
        <Formik
          initialValues={{
            title: card.title,
            tagline: card.tagline,
            reverseOrder: card.reverseOrder,
            beeminderGoal: card.beeminderGoal || '',
          }}
          onSubmit={async (values, formik) => {
            await updateCard({
              variables: {
                id: card.id,
                ...values,
                title: values.title.trim(),
                tagline: values.tagline.trim(),
                beeminderGoal: values.beeminderGoal.trim() || null,
              },
            })
            if (props.afterSave) props.afterSave()
            formik.resetForm()
          }}
        >
          {(formik) => (
            <>
              <B.Form onSubmit={formik.handleSubmit}>
                <B.Tabs defaultActiveKey="general" transition={false}>
                  <B.Tab eventKey="general" title="General" className="pt-3">
                    <B.Form.Group className="mb-3">
                      <B.Form.Label>Title</B.Form.Label>
                      <B.Form.Control
                        name="title"
                        id={`title-${formId}`}
                        value={formik.values.title}
                        onChange={formik.handleChange}
                        type="text"
                        ref={titleInputRef}
                        onKeyDown={async (event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                            await formik.submitForm()
                          }
                        }}
                      />
                    </B.Form.Group>

                    <B.Form.Group className="mb-3">
                      <B.Form.Label>Tagline</B.Form.Label>
                      <B.Form.Control
                        name="tagline"
                        id={`tagline-${formId}`}
                        value={formik.values.tagline}
                        onChange={formik.handleChange}
                        type="text"
                        onKeyDown={async (event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                            await formik.submitForm()
                          }
                        }}
                      />
                    </B.Form.Group>

                    <B.Form.Check name="reverseOrder" id={`reverse-${formId}`} className="mb-3">
                      <B.Form.Check.Input
                        name="reverseOrder"
                        id={`reverse-${formId}`}
                        checked={formik.values.reverseOrder}
                        onChange={formik.handleChange}
                        type="checkbox"
                      />
                      <B.Form.Check.Label>
                        Show comments in reverse order
                        <br />
                        <span className="text-muted small">
                          Good for cards that work like blog posts. Or maybe you just really like
                          the reverse order.
                        </span>
                      </B.Form.Check.Label>
                    </B.Form.Check>
                  </B.Tab>

                  <B.Tab eventKey="beeminder" title="Beeminder" className="pt-3">
                    <p className="text-muted small">
                      Sync comment count to <a href="https://beeminder.com">Beeminder</a>. The
                      current count will be posted as a datapoint — so your goal type should be
                      something like “Gain weight” rather than “Do more”. Make sure your account is
                      connected to Beeminder in <Link href={accountRoute()}>account settings</Link>.
                    </p>
                    <B.Form.Group className="mb-3">
                      <B.Form.Label>Beeminder goal slug</B.Form.Label>
                      <B.Form.Control
                        name="beeminderGoal"
                        id={`beeminderGoal-${formId}`}
                        value={formik.values.beeminderGoal}
                        onChange={formik.handleChange}
                        type="text"
                        onKeyDown={async (event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                            await formik.submitForm()
                          }
                        }}
                      />
                    </B.Form.Group>
                  </B.Tab>
                </B.Tabs>

                <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                  Save
                  {formik.isSubmitting && (
                    <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
                  )}
                </B.Button>

                <B.Button className="ms-2" variant="secondary" type="button" onClick={props.onHide}>
                  Cancel
                </B.Button>
              </B.Form>
            </>
          )}
        </Formik>
      </B.Modal.Body>
    </B.Modal>
  )
}
