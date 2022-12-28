/** Utilities for session management */

import React from "react"
import SuperTokensSession, { SessionAuth } from "supertokens-auth-react/recipe/session"

export type SessionData =
  | { status: "loading" }
  | { status: "logged-out" }
  | { status: "logged-in"; userId: string }

export function useSession(): SessionData {
  const sessionContext = SuperTokensSession.useSessionContext()
  if (sessionContext.loading) return { status: "loading" }
  if (sessionContext.doesSessionExist)
    return {
      status: "logged-in",
      userId: sessionContext.userId,
    }
  return { status: "logged-out" }
}

export function useUserId(): string | null {
  const session = useSession()
  if (session.status === "logged-in") return session.userId
  return null
}

export function RequireAuth(props: { children: React.ReactNode }) {
  return <SessionAuth>{props.children}</SessionAuth>
}
