import { useState, useEffect } from "react"
import { QueryFunction, QueryKey, useQueryClient } from "react-query"

export type QueryOnceResult<T> =
  | { status: 'loading', data: undefined, error: undefined }
  | { status: 'error', data: undefined, error: string }
  | { status: 'success', data: T, error: undefined }

// Like 'useQuery' but never refetches. Returns cached data if present.
export function useQueryOnce<T>(queryKey: QueryKey, queryFn: QueryFunction<T>): QueryOnceResult<T> {
  const queryClient = useQueryClient()
  const existingData = queryClient.getQueryData<T>(queryKey)
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>(!!existingData ? 'success' : 'loading')
  const [data, setData] = useState<T | undefined>(existingData)
  const [error, setError] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (status === 'loading')
      queryClient.fetchQuery(queryKey, queryFn)
        .then(data => {
          setData(data)
          setStatus('success')
        })
        .catch(err => {
          setStatus('error')
          setError((err as Error).message)
        })
  }, [queryKey, queryFn, queryClient, status])
  // @ts-expect-error
  return { status, data, error }
}