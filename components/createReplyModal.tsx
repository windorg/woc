import { Comment } from '@prisma/client'
import React from 'react'
import * as B from 'react-bootstrap'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { Formik } from 'formik'
import { callCreateReply } from 'pages/api/replies/create'
import { Reply } from '@prisma/client'
import { Tiptap, TiptapMethods } from './tiptap'
import { Reply_ } from 'components/replyComponent'

export class CreateReplyModal extends React.Component<{
  show: boolean
  comment: Comment
  // This callback will be called when the user tries to hide the modal. (The modal can't hide itself.)
  onHide: () => void
  afterReplyCreated: (newReply: Reply_) => void
}> {
  #editorRef: React.RefObject<TiptapMethods> = React.createRef()

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onHide}
        onEntered={() => this.#editorRef.current!.focus()}
      >
        <Modal.Header closeButton>
          <Modal.Title>Post a reply</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{}}
            onSubmit={async (values, formik) => {
              if (!this.#editorRef.current) throw Error("Editor is not initialized")
              const reply = await callCreateReply({
                ...values,
                commentId: this.props.comment.id,
                content: this.#editorRef.current.getMarkdown(),
              })
              this.props.afterReplyCreated(reply)
              formik.resetForm()
            }}
          >
            {formik => (
              <Form onSubmit={formik.handleSubmit} className="woc-reply-form">
                <div className="mb-3">
                  <Tiptap
                    autoFocus
                    onSubmit={formik.handleSubmit}
                    ref={this.#editorRef} />
                </div>
                <Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                  Post a reply
                  {formik.isSubmitting &&
                    <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
                </Button>
                <Button variant="secondary" type="button" className="ms-2"
                  onClick={this.props.onHide}>
                  Cancel
                </Button>
                {/* <Form.Check
                name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
                type="checkbox" className="ms-4" inline label="🔒 Private reply" /> */}
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    )
  }
}
