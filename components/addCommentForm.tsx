import { Card, Comment } from '@prisma/client'
import * as B from 'react-bootstrap'
import React from 'react'
import { Tiptap, TiptapMethods } from '../components/tiptap'
import { Formik } from 'formik'
import { useCreateComment } from 'lib/queries/comments'

// TODO don't allow posting with empty content
export function AddCommentForm(props: {
  cardId: Card['id']
  autoFocus?: boolean
  afterCreate?: () => void
}) {
  const editorRef = React.useRef<TiptapMethods>(null)
  const createCommentMutation = useCreateComment()
  return (
    <Formik
      initialValues={{ private: false }}
      onSubmit={async (values, formik) => {
        if (!editorRef.current) throw Error("Editor is not initialized")
        await createCommentMutation.mutateAsync({
          cardId: props.cardId,
          content: editorRef.current.getMarkdown(),
          ...values
        })
        if (props?.afterCreate) props.afterCreate()
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
              autoFocus={props.autoFocus}
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
