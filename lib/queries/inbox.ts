import { callInboxCount } from "pages/api/inbox/count"
import { QueryClient, useMutation, useQuery, useQueryClient } from "react-query"

// Keys

export const getInboxCountKey = (query: Record<string, never>) => ['getInboxCount', query]

// Queries

export function useInboxCount(
  options?: { refetchInterval?: number }
) {
  const query = useQuery(
    getInboxCountKey({}),
    async () => callInboxCount(),
    {
      staleTime: Infinity,
      refetchInterval: options?.refetchInterval,
    }
  )
  return query
}
