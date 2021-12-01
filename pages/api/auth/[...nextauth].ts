import { User } from '@prisma/client'
import { createHash, timingSafeEqual } from 'crypto'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../lib/db'

// Important! The salt should be base64-encoded
function pwstore_pbkdf1(password: Buffer, salt: string, iter: number): Buffer {
  let hash: Buffer = createHash('sha256').update(password).update(salt).digest()
  for (let i = 0; i < iter + 1; i++) {
    hash = createHash('sha256').update(hash).digest()
  }
  return hash
}

// Checks password stored in pwstore-fast format
function checkPassword(password: string, pwstring: string): boolean {
  console.log(password, pwstring)
  const [algo, strength, salt, hash] = pwstring.split('|')
  if (algo != 'sha256') return false
  // NB: pwstore-fast doesn't decode the salt from base64 before doing the hashing
  const res = pwstore_pbkdf1(Buffer.from(password, 'utf8'), salt, Math.pow(2, parseInt(strength)))
  return timingSafeEqual(Buffer.from(hash, 'base64'), res)
}

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