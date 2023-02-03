/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel-plugin for production.
 */
const documents = {
    "\n      mutation createComment($cardId: UUID!, $content: String!, $private: Boolean!) {\n        createComment(cardId: $cardId, content: $content, private: $private) {\n          id\n        }\n      }\n    ": types.CreateCommentDocument,
    "\n  query getBoardOwner($userId: UUID!) {\n    user(id: $userId) {\n      id\n      displayName\n      handle\n    }\n  }\n": types.GetBoardOwnerDocument,
    "\n  query getCardInfo($id: UUID!) {\n    card(id: $id) {\n      title\n      visibility\n    }\n  }\n": types.GetCardInfoDocument,
    "\n      mutation createCard($parentId: UUID!, $title: String!, $private: Boolean!) {\n        createCard(parentId: $parentId, title: $title, private: $private) {\n          id\n        }\n      }\n    ": types.CreateCardDocument,
    "\n      mutation reorderChild($id: UUID!, $childId: UUID!, $before: UUID, $after: UUID) {\n        reorderCardChildren(input: { id: $id, childId: $childId, before: $before, after: $after }) {\n          card {\n            id\n            childrenOrder\n          }\n        }\n      }\n    ": types.ReorderChildDocument,
    "\n      mutation updateCard($id: UUID!, $archived: Boolean, $private: Boolean) {\n        updateCard(input: { id: $id, archived: $archived, private: $private }) {\n          card {\n            id\n            archived\n            visibility\n          }\n        }\n      }\n    ": types.UpdateCardDocument,
    "\n      mutation deleteCard($id: UUID!) {\n        deleteCard(id: $id) {\n          parent {\n            id\n          }\n          ownerId\n        }\n      }\n    ": types.DeleteCardDocument,
    "\n      mutation updateCommentContent($id: UUID!, $content: String!) {\n        updateComment(input: { id: $id, content: $content }) {\n          comment {\n            id\n            content\n          }\n        }\n      }\n    ": types.UpdateCommentContentDocument,
    "\n      mutation updateComment($id: UUID!, $pinned: Boolean, $private: Boolean) {\n        updateComment(input: { id: $id, pinned: $pinned, private: $private }) {\n          comment {\n            id\n            pinned\n            visibility\n          }\n        }\n      }\n    ": types.UpdateCommentDocument,
    "\n      mutation deleteComment($id: UUID!) {\n        deleteComment(id: $id) {\n          card {\n            id\n          }\n        }\n      }\n    ": types.DeleteCommentDocument,
    "\n      mutation createTopLevelCard($title: String!, $private: Boolean!) {\n        createCard(title: $title, private: $private, parentId: null) {\n          id\n          ownerId\n        }\n      }\n    ": types.CreateTopLevelCardDocument,
    "\n      mutation createReply($commentId: UUID!, $content: String!) {\n        createReply(commentId: $commentId, content: $content) {\n          id\n        }\n      }\n    ": types.CreateReplyDocument,
    "\n  mutation updateCard_EditCardModal(\n    $id: UUID!\n    $title: String\n    $tagline: String\n    $reverseOrder: Boolean\n    $beeminderGoal: String\n  ) {\n    updateCard(\n      input: {\n        id: $id\n        title: $title\n        tagline: $tagline\n        reverseOrder: $reverseOrder\n        beeminderGoal: $beeminderGoal\n      }\n    ) {\n      card {\n        id\n        title\n        tagline\n        reverseOrder\n        beeminderGoal\n      }\n    }\n  }\n": types.UpdateCard_EditCardModalDocument,
    "\n  query getCards($userId: UUID!) {\n    user(id: $userId) {\n      id\n      allCards {\n        id\n        title\n      }\n    }\n  }\n": types.GetCardsDocument,
    "\n      mutation moveCard($id: UUID!, $newParentId: UUID) {\n        moveCard(id: $id, newParentId: $newParentId) {\n          card {\n            id\n            ownerId\n            parentChain\n          }\n          oldParent {\n            id\n          }\n          newParent {\n            id\n          }\n        }\n      }\n    ": types.MoveCardDocument,
    "\n      mutation updateReplyContent($id: UUID!, $content: String!) {\n        updateReply(input: { id: $id, content: $content }) {\n          reply {\n            id\n            content\n          }\n        }\n      }\n    ": types.UpdateReplyContentDocument,
    "\n      mutation deleteReply($id: UUID!) {\n        deleteReply(id: $id) {\n          comment {\n            id\n          }\n        }\n      }\n    ": types.DeleteReplyDocument,
    "\n  query getAllCards($userId: UUID!) {\n    user(id: $userId) {\n      id\n      allCards {\n        id\n        title\n        createdAt\n      }\n    }\n  }\n": types.GetAllCardsDocument,
    "\n      query getTopLevelCards {\n        topLevelCards {\n          id\n          title\n          ownerId\n          visibility\n        }\n      }\n    ": types.GetTopLevelCardsDocument,
    "\n  mutation followUser($userId: UUID!) {\n    followUser(id: $userId) {\n      id\n      followed\n    }\n  }\n": types.FollowUserDocument,
    "\n  mutation unfollowUser($userId: UUID!) {\n    unfollowUser(id: $userId) {\n      id\n      followed\n    }\n  }\n": types.UnfollowUserDocument,
    "\n      query getUser($userId: UUID!) {\n        user(id: $userId) {\n          id\n          displayName\n          handle\n          followed\n          topLevelCards {\n            id\n            title\n            ownerId\n            visibility\n          }\n        }\n      }\n    ": types.GetUserDocument,
    "\n  query getLoggedInUser($userId: UUID!) {\n    user(id: $userId) {\n      id\n      displayName\n      handle\n      beeminderUsername\n    }\n  }\n": types.GetLoggedInUserDocument,
    "\n      query getCard($id: UUID!) {\n        card(id: $id) {\n          id\n          title\n          tagline\n          visibility\n          parentId\n          canEdit\n          archived\n          reverseOrder\n          parentChain\n          childrenOrder\n          children {\n            id\n            title\n            visibility\n            tagline\n            archived\n            commentCount\n          }\n          owner {\n            id\n            handle\n          }\n        }\n      }\n    ": types.GetCardDocument,
    "\n      query getComments($cardId: UUID!) {\n        card(id: $cardId) {\n          id\n          comments {\n            id\n            content\n            createdAt\n            visibility\n            pinned\n            canEdit\n            replies {\n              id\n              content\n              visibility\n              canEdit\n              createdAt\n              canDelete\n              author {\n                id\n                displayName\n                userpicUrl\n              }\n            }\n          }\n        }\n      }\n    ": types.GetCommentsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation createComment($cardId: UUID!, $content: String!, $private: Boolean!) {\n        createComment(cardId: $cardId, content: $content, private: $private) {\n          id\n        }\n      }\n    "): (typeof documents)["\n      mutation createComment($cardId: UUID!, $content: String!, $private: Boolean!) {\n        createComment(cardId: $cardId, content: $content, private: $private) {\n          id\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getBoardOwner($userId: UUID!) {\n    user(id: $userId) {\n      id\n      displayName\n      handle\n    }\n  }\n"): (typeof documents)["\n  query getBoardOwner($userId: UUID!) {\n    user(id: $userId) {\n      id\n      displayName\n      handle\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getCardInfo($id: UUID!) {\n    card(id: $id) {\n      title\n      visibility\n    }\n  }\n"): (typeof documents)["\n  query getCardInfo($id: UUID!) {\n    card(id: $id) {\n      title\n      visibility\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation createCard($parentId: UUID!, $title: String!, $private: Boolean!) {\n        createCard(parentId: $parentId, title: $title, private: $private) {\n          id\n        }\n      }\n    "): (typeof documents)["\n      mutation createCard($parentId: UUID!, $title: String!, $private: Boolean!) {\n        createCard(parentId: $parentId, title: $title, private: $private) {\n          id\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation reorderChild($id: UUID!, $childId: UUID!, $before: UUID, $after: UUID) {\n        reorderCardChildren(input: { id: $id, childId: $childId, before: $before, after: $after }) {\n          card {\n            id\n            childrenOrder\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation reorderChild($id: UUID!, $childId: UUID!, $before: UUID, $after: UUID) {\n        reorderCardChildren(input: { id: $id, childId: $childId, before: $before, after: $after }) {\n          card {\n            id\n            childrenOrder\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation updateCard($id: UUID!, $archived: Boolean, $private: Boolean) {\n        updateCard(input: { id: $id, archived: $archived, private: $private }) {\n          card {\n            id\n            archived\n            visibility\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation updateCard($id: UUID!, $archived: Boolean, $private: Boolean) {\n        updateCard(input: { id: $id, archived: $archived, private: $private }) {\n          card {\n            id\n            archived\n            visibility\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation deleteCard($id: UUID!) {\n        deleteCard(id: $id) {\n          parent {\n            id\n          }\n          ownerId\n        }\n      }\n    "): (typeof documents)["\n      mutation deleteCard($id: UUID!) {\n        deleteCard(id: $id) {\n          parent {\n            id\n          }\n          ownerId\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation updateCommentContent($id: UUID!, $content: String!) {\n        updateComment(input: { id: $id, content: $content }) {\n          comment {\n            id\n            content\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation updateCommentContent($id: UUID!, $content: String!) {\n        updateComment(input: { id: $id, content: $content }) {\n          comment {\n            id\n            content\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation updateComment($id: UUID!, $pinned: Boolean, $private: Boolean) {\n        updateComment(input: { id: $id, pinned: $pinned, private: $private }) {\n          comment {\n            id\n            pinned\n            visibility\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation updateComment($id: UUID!, $pinned: Boolean, $private: Boolean) {\n        updateComment(input: { id: $id, pinned: $pinned, private: $private }) {\n          comment {\n            id\n            pinned\n            visibility\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation deleteComment($id: UUID!) {\n        deleteComment(id: $id) {\n          card {\n            id\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation deleteComment($id: UUID!) {\n        deleteComment(id: $id) {\n          card {\n            id\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation createTopLevelCard($title: String!, $private: Boolean!) {\n        createCard(title: $title, private: $private, parentId: null) {\n          id\n          ownerId\n        }\n      }\n    "): (typeof documents)["\n      mutation createTopLevelCard($title: String!, $private: Boolean!) {\n        createCard(title: $title, private: $private, parentId: null) {\n          id\n          ownerId\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation createReply($commentId: UUID!, $content: String!) {\n        createReply(commentId: $commentId, content: $content) {\n          id\n        }\n      }\n    "): (typeof documents)["\n      mutation createReply($commentId: UUID!, $content: String!) {\n        createReply(commentId: $commentId, content: $content) {\n          id\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation updateCard_EditCardModal(\n    $id: UUID!\n    $title: String\n    $tagline: String\n    $reverseOrder: Boolean\n    $beeminderGoal: String\n  ) {\n    updateCard(\n      input: {\n        id: $id\n        title: $title\n        tagline: $tagline\n        reverseOrder: $reverseOrder\n        beeminderGoal: $beeminderGoal\n      }\n    ) {\n      card {\n        id\n        title\n        tagline\n        reverseOrder\n        beeminderGoal\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation updateCard_EditCardModal(\n    $id: UUID!\n    $title: String\n    $tagline: String\n    $reverseOrder: Boolean\n    $beeminderGoal: String\n  ) {\n    updateCard(\n      input: {\n        id: $id\n        title: $title\n        tagline: $tagline\n        reverseOrder: $reverseOrder\n        beeminderGoal: $beeminderGoal\n      }\n    ) {\n      card {\n        id\n        title\n        tagline\n        reverseOrder\n        beeminderGoal\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getCards($userId: UUID!) {\n    user(id: $userId) {\n      id\n      allCards {\n        id\n        title\n      }\n    }\n  }\n"): (typeof documents)["\n  query getCards($userId: UUID!) {\n    user(id: $userId) {\n      id\n      allCards {\n        id\n        title\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation moveCard($id: UUID!, $newParentId: UUID) {\n        moveCard(id: $id, newParentId: $newParentId) {\n          card {\n            id\n            ownerId\n            parentChain\n          }\n          oldParent {\n            id\n          }\n          newParent {\n            id\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation moveCard($id: UUID!, $newParentId: UUID) {\n        moveCard(id: $id, newParentId: $newParentId) {\n          card {\n            id\n            ownerId\n            parentChain\n          }\n          oldParent {\n            id\n          }\n          newParent {\n            id\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation updateReplyContent($id: UUID!, $content: String!) {\n        updateReply(input: { id: $id, content: $content }) {\n          reply {\n            id\n            content\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation updateReplyContent($id: UUID!, $content: String!) {\n        updateReply(input: { id: $id, content: $content }) {\n          reply {\n            id\n            content\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation deleteReply($id: UUID!) {\n        deleteReply(id: $id) {\n          comment {\n            id\n          }\n        }\n      }\n    "): (typeof documents)["\n      mutation deleteReply($id: UUID!) {\n        deleteReply(id: $id) {\n          comment {\n            id\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getAllCards($userId: UUID!) {\n    user(id: $userId) {\n      id\n      allCards {\n        id\n        title\n        createdAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query getAllCards($userId: UUID!) {\n    user(id: $userId) {\n      id\n      allCards {\n        id\n        title\n        createdAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query getTopLevelCards {\n        topLevelCards {\n          id\n          title\n          ownerId\n          visibility\n        }\n      }\n    "): (typeof documents)["\n      query getTopLevelCards {\n        topLevelCards {\n          id\n          title\n          ownerId\n          visibility\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation followUser($userId: UUID!) {\n    followUser(id: $userId) {\n      id\n      followed\n    }\n  }\n"): (typeof documents)["\n  mutation followUser($userId: UUID!) {\n    followUser(id: $userId) {\n      id\n      followed\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation unfollowUser($userId: UUID!) {\n    unfollowUser(id: $userId) {\n      id\n      followed\n    }\n  }\n"): (typeof documents)["\n  mutation unfollowUser($userId: UUID!) {\n    unfollowUser(id: $userId) {\n      id\n      followed\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query getUser($userId: UUID!) {\n        user(id: $userId) {\n          id\n          displayName\n          handle\n          followed\n          topLevelCards {\n            id\n            title\n            ownerId\n            visibility\n          }\n        }\n      }\n    "): (typeof documents)["\n      query getUser($userId: UUID!) {\n        user(id: $userId) {\n          id\n          displayName\n          handle\n          followed\n          topLevelCards {\n            id\n            title\n            ownerId\n            visibility\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query getLoggedInUser($userId: UUID!) {\n    user(id: $userId) {\n      id\n      displayName\n      handle\n      beeminderUsername\n    }\n  }\n"): (typeof documents)["\n  query getLoggedInUser($userId: UUID!) {\n    user(id: $userId) {\n      id\n      displayName\n      handle\n      beeminderUsername\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query getCard($id: UUID!) {\n        card(id: $id) {\n          id\n          title\n          tagline\n          visibility\n          parentId\n          canEdit\n          archived\n          reverseOrder\n          parentChain\n          childrenOrder\n          children {\n            id\n            title\n            visibility\n            tagline\n            archived\n            commentCount\n          }\n          owner {\n            id\n            handle\n          }\n        }\n      }\n    "): (typeof documents)["\n      query getCard($id: UUID!) {\n        card(id: $id) {\n          id\n          title\n          tagline\n          visibility\n          parentId\n          canEdit\n          archived\n          reverseOrder\n          parentChain\n          childrenOrder\n          children {\n            id\n            title\n            visibility\n            tagline\n            archived\n            commentCount\n          }\n          owner {\n            id\n            handle\n          }\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      query getComments($cardId: UUID!) {\n        card(id: $cardId) {\n          id\n          comments {\n            id\n            content\n            createdAt\n            visibility\n            pinned\n            canEdit\n            replies {\n              id\n              content\n              visibility\n              canEdit\n              createdAt\n              canDelete\n              author {\n                id\n                displayName\n                userpicUrl\n              }\n            }\n          }\n        }\n      }\n    "): (typeof documents)["\n      query getComments($cardId: UUID!) {\n        card(id: $cardId) {\n          id\n          comments {\n            id\n            content\n            createdAt\n            visibility\n            pinned\n            canEdit\n            replies {\n              id\n              content\n              visibility\n              canEdit\n              createdAt\n              canDelete\n              author {\n                id\n                displayName\n                userpicUrl\n              }\n            }\n          }\n        }\n      }\n    "];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;