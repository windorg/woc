import { deleteById, mergeById } from "lib/array";
import { CreateCommentBody } from "pages/api/comments/create";
import { DeleteCommentBody } from "pages/api/comments/delete";
import { ListCommentsData, ListCommentsQuery } from "pages/api/comments/list";
import { UpdateCommentBody } from "pages/api/comments/update";
import {
  callCreateComment,
  callDeleteComment,
  callListComments,
  callUpdateComment,
} from "@lib/api";
import {
  Query,
  QueryClient,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "react-query";
import { keyPredicate, updateQueriesData } from "./util";

// Keys

export const listCommentsKey = (query: ListCommentsQuery) => [
  "listComments",
  query,
];
export const fromListCommentsKey = (key: QueryKey) =>
  key[0] === "listComments" ? (key[1] as ListCommentsQuery) : null;

// Queries

export function useComments(
  query: ListCommentsQuery,
  options?: { initialData?: ListCommentsData }
) {
  return useQuery(listCommentsKey(query), async () => callListComments(query), {
    cacheTime: Infinity,
    staleTime: Infinity,
    initialData: options?.initialData,
  });
}

// Mutations

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data: CreateCommentBody) => {
      return callCreateComment(data);
    },
    {
      onSuccess: (comment, variables) => {
        updateQueriesData<ListCommentsData>(
          queryClient,
          {
            predicate: keyPredicate(fromListCommentsKey, (query) =>
              query.cards.includes(comment.cardId)
            ),
          },
          (listCommentsData) => [...listCommentsData, comment]
        );
      },
    }
  );
}

export function useUpdateComment() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data: UpdateCommentBody) => {
      return callUpdateComment(data);
    },
    {
      onSuccess: (updates, variables) => {
        updateQueriesData<ListCommentsData>(
          queryClient,
          { predicate: keyPredicate(fromListCommentsKey, (query) => true) },
          (listCommentsData) =>
            mergeById(listCommentsData, { ...updates, id: variables.commentId })
        );
      },
    }
  );
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation(
    async (data: DeleteCommentBody) => {
      return callDeleteComment(data);
    },
    {
      onSuccess: (_void, variables) => {
        updateQueriesData<ListCommentsData>(
          queryClient,
          { predicate: keyPredicate(fromListCommentsKey, (query) => true) },
          (listCommentsData) =>
            deleteById(listCommentsData, variables.commentId)
        );
      },
    }
  );
}
