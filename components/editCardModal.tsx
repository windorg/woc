import { Card } from "@prisma/client"
import { Formik } from "formik"
import { cardSettings } from "lib/model-settings"
import React from "react"
import * as B from 'react-bootstrap'
import { useUpdateCard } from "lib/queries/cards"
import Link from "next/link"
import { accountRoute } from "lib/routes"

export function EditCardModal(props: {
  card: Card
  show: boolean
  onHide: () => void
  afterSave?: () => void
}) {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  const titleInputRef: React.RefObject<HTMLInputElement> = React.useRef(null)
  const updateCardMutation = useUpdateCard()
  const { card } = props
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
            reverseOrder: cardSettings(card).reverseOrder,
            beeminderGoal: cardSettings(card).beeminderGoal || '',
          }}
          onSubmit={async (values, formik) => {
            await updateCardMutation.mutateAsync({
              cardId: card.id,
              ...values,
              title: values.title.trim(),
              tagline: values.tagline.trim(),
              beeminderGoal: values.beeminderGoal.trim() || null,
            })
            if (props.afterSave) props.afterSave()
            formik.resetForm()
          }}
        >
          {formik => (<>
            <B.Form onSubmit={formik.handleSubmit}>

              <B.Tabs defaultActiveKey="general" transition={false}>
                <B.Tab eventKey="general" title="General" className="pt-3">
                  <B.Form.Group className="mb-3">
                    <B.Form.Label>Title</B.Form.Label>
                    <B.Form.Control
                      name="title" id="title" value={formik.values.title} onChange={formik.handleChange}
                      type="text" ref={titleInputRef} />
                  </B.Form.Group>

                  <B.Form.Group className="mb-3">
                    <B.Form.Label>Tagline</B.Form.Label>
                    <B.Form.Control
                      name="tagline" id="tagline" value={formik.values.tagline} onChange={formik.handleChange}
                      type="text" />
                  </B.Form.Group>

                  <B.Form.Check name="reverseOrder" id="reverseOrder" className="mb-3">
                    <B.Form.Check.Input
                      name="reverseOrder" id="reverseOrder"
                      checked={formik.values.reverseOrder}
                      onChange={formik.handleChange} type="checkbox" />
                    <B.Form.Check.Label>
                      Show comments in reverse order<br />
                      <span className="text-muted small">
                        Good for cards that work like blog posts. Or maybe you just really like the reverse order.
                      </span>
                    </B.Form.Check.Label>
                  </B.Form.Check>
                </B.Tab>

                <B.Tab eventKey="beeminder" title="Beeminder" className="pt-3">
                  <p className="text-muted small">
                    Sync comment count to <a href="https://beeminder.com">Beeminder</a>. The current count will be posted as a datapoint — so your goal type should be something like “Gain weight” rather than “Do more”. Make sure your account is connected to Beeminder in <Link href={accountRoute()}><a>account settings</a></Link>.
                  </p>
                  <B.Form.Group className="mb-3">
                    <B.Form.Label>Beeminder goal slug</B.Form.Label>
                    <B.Form.Control
                      name="beeminderGoal" id="beeminderGoal" value={formik.values.beeminderGoal} onChange={formik.handleChange}
                      type="text" />
                  </B.Form.Group>
                </B.Tab>
              </B.Tabs>

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