import { deleteById, mergeById } from "lib/array";
import { CreateReplyBody } from "pages/api/replies/create";
import { DeleteReplyBody } from "pages/api/replies/delete";
import { ListRepliesData, ListRepliesQuery } from "pages/api/replies/list";
import { UpdateReplyBody } from "pages/api/replies/update";
import {
  Query,
  QueryClient,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { keyPredicate, updateQueriesData } from "./util";
import {
  callCreateReply,
  callDeleteReply,
  callListReplies,
  callUpdateReply,
} from "@lib/api";

// Keys

export const listRepliesKey = (query: ListRepliesQuery) => [
  "listReplies",
  query,
];
export const fromListRepliesKey = (key: QueryKey) =>
  key[0] === "listReplies" ? (key[1] as ListRepliesQuery) : null;

// Queries

export function useReplies(
  query: ListRepliesQuery,
  options?: { initialData?: ListRepliesData }
) {
  return useQuery(listRepliesKey(query), async () => callListReplies(query), {
    cacheTime: Infinity,
    staleTime: Infinity,
    initialData: options?.initialData,
  });
}

// Mutations

export function useCreateReply() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data: CreateReplyBody) => {
      return callCreateReply(data);
    },
    {
      onSuccess: (reply, variables) => {
        updateQueriesData<ListRepliesData>(
          queryClient,
          {
            predicate: keyPredicate(fromListRepliesKey, (query) =>
              query.cards.includes(reply.comment.cardId)
            ),
          },
          (listRepliesData) => [...listRepliesData, reply]
        );
      },
    }
  );
}

export function useUpdateReply() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data: UpdateReplyBody) => {
      return callUpdateReply(data);
    },
    {
      onSuccess: (updates, variables) => {
        updateQueriesData<ListRepliesData>(
          queryClient,
          { predicate: keyPredicate(fromListRepliesKey, (query) => true) },
          (listRepliesData) =>
            mergeById(listRepliesData, { ...updates, id: variables.replyId })
        );
      },
    }
  );
}

export function useDeleteReply() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data: DeleteReplyBody) => {
      return callDeleteReply(data);
    },
    {
      onSuccess: (_void, variables) => {
        updateQueriesData<ListRepliesData>(
          queryClient,
          { predicate: keyPredicate(fromListRepliesKey, (query) => true) },
          (listRepliesData) => deleteById(listRepliesData, variables.replyId)
        );
      },
    }
  );
}
