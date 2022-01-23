import { Card, Comment } from '@prisma/client'
import { Button, Form } from 'react-bootstrap'
import React, { createRef, RefObject } from 'react'
import { Tiptap, TiptapMethods } from '../components/tiptap'
import { callCreateComment } from '../pages/api/comments/create'
import { Formik } from 'formik'

// TODO don't allow posting with empty content
export class AddCommentForm extends React.Component<{
  cardId: Card['id']
  afterCommentCreated: (comment: Comment) => void
}> {
  // NB: We use a class because refs are set to null on rerenders when using functional components. Although now I'm not
  // sure it's true anymore. Maybe re-check with useRef.
  #editorRef: RefObject<TiptapMethods> = createRef();

  focus() {
    this.#editorRef.current?.focus()
  }

  render() {
    return (
      <Formik
        initialValues={{ private: false }}
        onSubmit={async (values, formik) => {
          if (!this.#editorRef.current)
            throw Error("Editor is not initialized")
          const comment = await callCreateComment({
            cardId: this.props.cardId,
            content: this.#editorRef.current.getMarkdown(),
            ...values
          })
          this.props.afterCommentCreated(comment)
          this.#editorRef.current.clearContent()
          formik.resetForm()
        }}
      >
        {formik => (
          <Form onSubmit={formik.handleSubmit} className="woc-comment-form">
            <div className="mb-3" style={{ maxWidth: "40rem", width: "100%" }}>
              <Tiptap
                content=""
                onSubmit={formik.handleSubmit}
                autoFocus
                ref={this.#editorRef} />
            </div>
            <Button variant="primary" type="submit">Post</Button>
            <Form.Check
              name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
              type="checkbox" className="ms-4" inline label="🔒 Private comment" />
          </Form>
        )}
      </Formik>
    )
  }
}
