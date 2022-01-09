import { NextApiRequest, NextApiResponse } from 'next'
import { User } from '@prisma/client'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import { getSession } from 'next-auth/react'
import _ from 'lodash'
import { hashPassword } from 'lib/password'
import axios, { AxiosError } from 'axios'

interface SignupRequest extends NextApiRequest {
  body: {
    email: User['email']
    handle: User['handle']
    displayName: User['displayName']
    password: string
  }
}

export type SignupBody = SignupRequest['body']

const schema: SchemaOf<SignupBody> = yup.object({
  email: yup.string().email().label("Email").required(),
  handle: yup.string().matches(/^[a-zA-Z0-9_-]{1,64}/).label("Handle").required(),
  displayName: yup.string().label("Name").required(),
  password: yup.string().min(1).max(64).label("Password").required()
})

export type SignupResponse
  = { success: true }
  | { success: false, errors: Record<string, string> }

export default async function signup(req: SignupRequest, res: NextApiResponse<SignupResponse>) {
  if (req.method === 'POST') {
    const session = await getSession({ req })
    if (session) return res.status(403)

    const errors = {} as any
    const body = await schema.validate(req.body, { abortEarly: false })
      .catch((err: yup.ValidationError) => {
        err.inner.forEach(e => { errors[e.path!] = e.message })
        res.status(400).json({ success: false, errors })
        return null
      })
    if (!body) return

    const handleExists = (await prisma.user.count({ where: { handle: body.handle } })) > 0
    if (handleExists) errors.handle = 'This handle is already taken'
    const emailExists = (await prisma.user.count({ where: { email: body.email } })) > 0
    if (emailExists) errors.email = 'A user already exists with this email'
    if (!_.isEmpty(errors)) return res.status(400).json({ success: false, errors })

    await prisma.user.create({
      data: {
        email: body.email,
        handle: body.handle,
        displayName: body.displayName,
        passwordHash: hashPassword(body.password),
      }
    })
    return res.status(201).send({ success: true })
  }
}

export async function callSignup(body: SignupBody): Promise<SignupResponse> {
  const { data } = await axios.post<SignupResponse>(
    '/api/auth/signup',
    body,
    { validateStatus: status => (status < 400 || status === 400 || status === 409) }
  )
  return data
}
