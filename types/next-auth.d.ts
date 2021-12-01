import NextAuth from "next-auth"
import { User } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id: User['id']
  }
  interface Session {
    userId: User['id']
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: User['id']
  }
}
