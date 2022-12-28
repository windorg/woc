import NextAuth from 'next-auth'
import * as Prisma from '@prisma/client'

declare module 'next-auth' {
  interface User {
    id: Prisma.User['id']
  }
  interface Session {
    userId: Prisma.User['id']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: Prisma.User['id']
  }
}
