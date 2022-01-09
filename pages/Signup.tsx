import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User } from '@prisma/client'
import { prisma } from '../lib/db'
import React, { useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import { BoardsCrumb } from '../components/breadcrumbs'
import Link from 'next/link'
import { getSession, signIn, signOut, useSession } from 'next-auth/react'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import _ from 'lodash'
import { Formik } from 'formik'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { callSignup } from './api/auth/signup'

type Props = Record<string, never>

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const props: Props = {}
  return {
    props: serialize(props)
  }
}

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
        const result = await callSignup(values)
        if (result.success) {
          await signIn("credentials", {
            email: values.email, password: values.password,
            callbackUrl: '/Boards'
          })
        } else {
          console.log(result.errors)
          actions.setErrors(result.errors)
        }
      }}
    >
      {formik => (
        <Form onSubmit={formik.handleSubmit} className="mt-5" id="signup_panel">
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <InputGroup hasValidation>
              <Form.Control
                name="email" id="email" value={formik.values.email} onChange={formik.handleChange}
                type="email" placeholder="alice@example.com"
                isInvalid={!!formik.errors.email} />
              <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Handle (like a Twitter username)</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text>@</InputGroup.Text>
              <Form.Control
                name="handle" id="handle" value={formik.values.handle} onChange={formik.handleChange}
                type="text" placeholder="alice"
                isInvalid={!!formik.errors.handle} />
              <Form.Control.Feedback type="invalid">{formik.errors.handle}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Name (can be anything)</Form.Label>
            <InputGroup hasValidation>
              <Form.Control
                name="displayName" id="displayName" value={formik.values.displayName} onChange={formik.handleChange}
                type="text" placeholder="Alice"
                isInvalid={!!formik.errors.displayName} />
              <Form.Control.Feedback type="invalid">{formik.errors.displayName}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <InputGroup hasValidation>
              <Form.Control
                name="password" id="password" value={formik.values.password} onChange={formik.handleChange}
                type="password"
                isInvalid={!!formik.errors.password} />
              <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <div className="d-grid mt-4">
            <Button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Creating an account..." : "Sign up"}
            </Button>
          </div>
        </Form>
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

      <Breadcrumb>
        <BoardsCrumb />
        <Breadcrumb.Item active>Sign up</Breadcrumb.Item>
      </Breadcrumb>

      <h1>Sign up</h1>

      {session
        ?
        <p>
          To create a new account, please <a href="#" onClick={async () => signOut()}>log out</a> first.
        </p>
        :
        <SignupForm />
      }
    </>
  )
}

export default Signup
