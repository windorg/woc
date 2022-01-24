import { Card, Comment } from '@prisma/client'
import * as B from 'react-bootstrap'
import React from 'react'
import { Tiptap, TiptapMethods } from '../components/tiptap'
import { callCreateComment } from '../pages/api/comments/create'
import { Formik } from 'formik'

// TODO don't allow posting with empty content
export function AddCommentForm(props: {
  cardId: Card['id']
  afterCommentCreated: (comment: Comment) => void
}) {
  const editorRef = React.useRef<TiptapMethods>(null)
  return (
    <Formik
      initialValues={{ private: false }}
      onSubmit={async (values, formik) => {
        if (!editorRef.current)
          throw Error("Editor is not initialized")
        const comment = await callCreateComment({
          cardId: props.cardId,
          content: editorRef.current.getMarkdown(),
          ...values
        })
        props.afterCommentCreated(comment)
        editorRef.current.clearContent()
        formik.resetForm()
      }}
    >
      {formik => (
        <B.Form onSubmit={formik.handleSubmit} className="woc-comment-form">
          <div className="mb-3" style={{ maxWidth: "40rem", width: "100%" }}>
            <Tiptap
              content=""
              onSubmit={formik.handleSubmit}
              autoFocus
              ref={editorRef} />
          </div>
          <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            Post
            {formik.isSubmitting &&
              <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
          </B.Button>
          <B.Form.Check
            name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
            type="checkbox" className="ms-4" inline label="🔒 Private comment" />
        </B.Form>
      )}
    </Formik>
  )
}
