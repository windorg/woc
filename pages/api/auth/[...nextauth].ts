import { User } from '@prisma/client'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../lib/db'
import { checkPassword } from '../../../lib/password'

export default NextAuth({
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _req): Promise<User | null> {
        if (!credentials) return null
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })
        if (!user) return null
        const isValidPassword = checkPassword(credentials.password, user.passwordHash)
        if (!isValidPassword) return null
        return user
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token, user }) {
      if (token) { session.userId = token.userId }
      return session
    }
  }
})