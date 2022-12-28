import type { NextPage } from 'next'
import Head from 'next/head'
import * as B from 'react-bootstrap'
import React from 'react'
import { BoardsCrumb } from '../components/breadcrumbs'
import { signIn, signOut, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import _ from 'lodash'
import { Formik } from 'formik'
import { boardsRoute } from 'lib/routes'
import { callSignup } from '@lib/api'

function SignupForm(props) {
  return (
    <Formik
      initialValues={{ email: '', handle: '', displayName: '', password: '' }}
      validate={(values) => {
        const errors = {} as any
        if (!/^[a-zA-Z0-9_-]*$/.test(values.handle)) {
          errors.handle = 'Only a-z, digits, _ and -'
        }
        return errors
      }}
      onSubmit={async (values, actions) => {
        const result = await callSignup(values, { returnErrors: true })
        if (result.success) {
          await signIn('credentials', {
            email: values.email,
            password: values.password,
            callbackUrl: boardsRoute(),
          })
        } else {
          actions.setErrors(result.error.fields)
        }
      }}
    >
      {(formik) => (
        <B.Form onSubmit={formik.handleSubmit} className="mt-5" id="signup_panel">
          <B.Form.Group className="mb-3">
            <B.Form.Label>Email</B.Form.Label>
            <B.InputGroup hasValidation>
              <B.Form.Control
                name="email"
                id="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                type="email"
                placeholder="alice@example.com"
                isInvalid={!!formik.errors.email}
              />
              <B.Form.Control.Feedback type="invalid">{formik.errors.email}</B.Form.Control.Feedback>
            </B.InputGroup>
          </B.Form.Group>

          <B.Form.Group className="mb-3">
            <B.Form.Label>Handle (like a Twitter username)</B.Form.Label>
            <B.InputGroup hasValidation>
              <B.InputGroup.Text>@</B.InputGroup.Text>
              <B.Form.Control
                name="handle"
                id="handle"
                value={formik.values.handle}
                onChange={formik.handleChange}
                type="text"
                placeholder="alice"
                isInvalid={!!formik.errors.handle}
              />
              <B.Form.Control.Feedback type="invalid">{formik.errors.handle}</B.Form.Control.Feedback>
            </B.InputGroup>
          </B.Form.Group>

          <B.Form.Group className="mb-3">
            <B.Form.Label>Name (can be anything)</B.Form.Label>
            <B.InputGroup hasValidation>
              <B.Form.Control
                name="displayName"
                id="displayName"
                value={formik.values.displayName}
                onChange={formik.handleChange}
                type="text"
                placeholder="Alice"
                isInvalid={!!formik.errors.displayName}
              />
              <B.Form.Control.Feedback type="invalid">{formik.errors.displayName}</B.Form.Control.Feedback>
            </B.InputGroup>
          </B.Form.Group>

          <B.Form.Group className="mb-3">
            <B.Form.Label>Password</B.Form.Label>
            <B.InputGroup hasValidation>
              <B.Form.Control
                name="password"
                id="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                type="password"
                isInvalid={!!formik.errors.password}
              />
              <B.Form.Control.Feedback type="invalid">{formik.errors.password}</B.Form.Control.Feedback>
            </B.InputGroup>
          </B.Form.Group>

          <div className="d-grid mt-4">
            <B.Button variant="primary" type="submit" disabled={formik.isSubmitting}>
              Sign up
              {formik.isSubmitting && <B.Spinner className="ms-2" size="sm" animation="border" role="status" />}
            </B.Button>
          </div>
        </B.Form>
      )}
    </Formik>
  )
}

const Signup: NextPage<SuperJSONResult> = (props) => {
  const { data: session } = useSession()

  return (
    <>
      <Head>
        <title>Sign up / WOC</title>
      </Head>

      <B.Breadcrumb>
        <BoardsCrumb />
        <B.Breadcrumb.Item active>Sign up</B.Breadcrumb.Item>
      </B.Breadcrumb>

      <h1>Sign up</h1>

      {session ? (
        <p>
          To create a new account, please{' '}
          <a href="#" onClick={async () => signOut()}>
            log out
          </a>{' '}
          first.
        </p>
      ) : (
        <SignupForm />
      )}
    </>
  )
}

export default Signup
