import { Card, Comment } from '@prisma/client'
import * as B from 'react-bootstrap'
import React, { useId } from 'react'
import { Tiptap, TiptapMethods } from '../components/tiptap'
import { Formik } from 'formik'
import { useMutation } from '@apollo/client'
import { graphql } from 'generated/graphql'
import { evictCardComments } from '@lib/graphql/cache'

const useCreateComment = () => {
  const [action, result] = useMutation(
    graphql(`
      mutation createComment($cardId: UUID!, $content: String!, $private: Boolean!) {
        createComment(cardId: $cardId, content: $content, private: $private) {
          id
        }
      }
    `),
    {
      update: (cache, { data }, { variables }) => {
        evictCardComments(cache, { cardId: variables!.cardId })
      },
    }
  )
  return { do: action, result }
}

// TODO don't allow posting with empty content
export function AddCommentForm(props: {
  cardId: Card['id']
  autoFocus?: boolean
  afterCreate?: () => void
}) {
  const editorRef = React.useRef<TiptapMethods>(null)
  const createCommentMutation = useCreateComment()
  const formId = useId()
  return (
    <Formik
      initialValues={{ private: false }}
      onSubmit={async (values, formik) => {
        if (!editorRef.current) throw Error('Editor is not initialized')
        await createCommentMutation.do({
          variables: {
            cardId: props.cardId,
            content: editorRef.current.getMarkdown(),
            ...values,
          },
        })
        if (props?.afterCreate) props.afterCreate()
        editorRef.current.clearContent()
        formik.resetForm()
      }}
    >
      {(formik) => (
        <B.Form onSubmit={formik.handleSubmit} className="woc-comment-form">
          <div className="mb-3" style={{ maxWidth: '40rem', width: '100%' }}>
            <Tiptap
              content=""
              onSubmit={formik.handleSubmit}
              autoFocus={props.autoFocus}
              ref={editorRef}
            />
          </div>
          <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
            Post
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
            label="🔒 Private comment"
          />
        </B.Form>
      )}
    </Formik>
  )
}
