import { Board } from "@prisma/client"
import { unsafeCanSee } from "lib/access"
import { callGetBoard, GetBoardResponse } from "pages/api/boards/get"
import { callUpdateBoard, UpdateBoardBody } from "pages/api/boards/update"
import { callCreateCard, CreateCardBody } from "pages/api/cards/create"
import { QueryClient, useMutation, useQuery, useQueryClient } from "react-query"

const getBoardKey = (props: { boardId: Board['id'] }) => ['getBoard', props]

export async function prefetchBoard(queryClient: QueryClient, props: { boardId: Board['id'] }) {
  await queryClient.prefetchQuery(
    getBoardKey(props),
    async () => callGetBoard(props)
  )
}

// TODO: give a choice between autoupdating and not
//
// TODO: we'd also probably like to use the normal react-query mechanism for signalling errors,
// instead of carrying around the error branch of GetBoardResponse
export function useBoard(
  props: { boardId: Board['id'] },
  options?: { initialData?: GetBoardResponse }
) {
  const query = useQuery(
    getBoardKey({ boardId: props.boardId }),
    async () => callGetBoard({ boardId: props.boardId }),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      initialData: options?.initialData,
    }
  )
  return query
}

export function useUpdateBoard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: UpdateBoardBody) => { return callUpdateBoard(data) },
    {
      onSuccess: (updates, variables) => {
        queryClient.setQueryData<GetBoardResponse | undefined>(
          getBoardKey({ boardId: variables.boardId }),
          getBoardResponse => {
            if (!getBoardResponse || !getBoardResponse.success) return getBoardResponse
            return {
              ...getBoardResponse,
              data: { ...getBoardResponse.data, ...updates }
            }
          })
      }
    })
}

export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation(
    async (data: CreateCardBody) => { return callCreateCard(data) },
    {
      onSuccess: (card, variables) => {
        const card_ = unsafeCanSee({ ...card, _count: { comments: 0 } })
        queryClient.setQueryData<GetBoardResponse | undefined>(
          getBoardKey({ boardId: variables.boardId }),
          getBoardResponse => {
            if (!getBoardResponse || !getBoardResponse.success) return getBoardResponse
            return {
              ...getBoardResponse,
              data: {
                ...getBoardResponse.data,
                cards: [...getBoardResponse.data.cards, card_]
              }
            }
          })
      }
    })
}