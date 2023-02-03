import type * as GQL from 'generated/graphql/graphql'
import React from 'react'
import * as B from 'react-bootstrap'
import { Formik } from 'formik'
import { Tiptap, TiptapMethods } from './tiptap'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { evictCommentReplies } from '@lib/graphql/cache'

const useCreateReply = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation createReply($commentId: UUID!, $content: String!) {
        createReply(commentId: $commentId, content: $content) {
          id
        }
      }
    `),
    {
      update: (cache, { data }, { variables }) => {
        evictCommentReplies(cache, { commentId: variables!.commentId })
      },
    }
  )
  return { do: action, result }
}

export function CreateReplyModal(props: {
  show: boolean
  comment: Pick<GQL.Comment, 'id'>
  // This callback will be called when the user tries to hide the modal. (The modal can't hide itself.)
  onHide: () => void
  afterCreate?: () => void
}) {
  const editorRef: React.RefObject<TiptapMethods> = React.useRef(null)
  const createReplyMutation = useCreateReply()
  return (
    <B.Modal
      backdrop="static"
      keyboard={false}
      show={props.show}
      onHide={props.onHide}
      onEntered={() => editorRef.current!.focus()}
    >
      <B.Modal.Header closeButton>
        <B.Modal.Title>Post a reply</B.Modal.Title>
      </B.Modal.Header>
      <B.Modal.Body>
        <Formik
          initialValues={{}}
          onSubmit={async (values, formik) => {
            if (!editorRef.current) throw Error('Editor is not initialized')
            await createReplyMutation.do({
              variables: {
                ...values,
                commentId: props.comment.id,
                content: editorRef.current.getMarkdown(),
              },
            })
            if (props.afterCreate) props.afterCreate()
            formik.resetForm()
          }}
        >
          {(formik) => (
            <B.Form onSubmit={formik.handleSubmit} className="woc-reply-form">
              <div className="mb-3">
                <Tiptap autoFocus onSubmit={formik.handleSubmit} ref={editorRef} />
              </div>
              <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
                Post a reply
                {formik.isSubmitting && (
                  <B.Spinner className="ms-2" size="sm" animation="border" role="status" />
                )}
              </B.Button>
              <B.Button variant="secondary" type="button" className="ms-2" onClick={props.onHide}>
                Cancel
              </B.Button>
              {/* <Form.Check
                name="private" id="private" checked={formik.values.private} onChange={formik.handleChange}
                type="checkbox" className="ms-4" inline label="🔒 Private reply" /> */}
            </B.Form>
          )}
        </Formik>
      </B.Modal.Body>
    </B.Modal>
  )
}
