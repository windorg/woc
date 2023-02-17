// https://www.apollographql.com/docs/technotes/TN0034-react-context/

import React, { createContext, useContext } from 'react'
import { ApolloQueryResult, useQuery } from '@apollo/client'
import { useSession } from 'next-auth/react'
import { graphql } from 'generated/graphql'

const useGetCurrentUserInfo = () => {
  const { data: session } = useSession()
  const userId = session?.userId ?? null
  const query = useQuery(
    graphql(`
      query getCurrentUserInfo($userId: UUID!) {
        user(id: $userId) {
          id
          betaAccess
        }
      }
    `),
    {
      variables: { userId: userId! },
      skip: !userId,
    }
  )
  if (userId) return query
  else
    return {
      data: { user: null },
      error: undefined,
      loading: false,
      refetch: async () => Promise.resolve({} as ApolloQueryResult<any>),
    }
}

interface QueryResult<TData> {
  data?: TData
  error?: any
  loading: boolean
}

interface QueryContextValue<TData> {
  queryData: QueryResult<TData>
  refetch: () => Promise<ApolloQueryResult<TData>>
}

const CurrentUserContext = createContext<
  QueryContextValue<{ user: { id: string; betaAccess: boolean | null } | null }>
>({
  queryData: { loading: true },
  refetch: async () => Promise.resolve({} as ApolloQueryResult<any>),
})

export const CurrentUserProvider = (props: { children: React.ReactNode }) => {
  const { data, error, loading, refetch } = useGetCurrentUserInfo()
  const value = { queryData: { data, error, loading }, refetch }
  return <CurrentUserContext.Provider value={value}>{props.children}</CurrentUserContext.Provider>
}

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  }
  return context.queryData?.data?.user
}
