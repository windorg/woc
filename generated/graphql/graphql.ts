/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: Date;
  /** A field whose value is a generic Universally Unique Identifier: https://en.wikipedia.org/wiki/Universally_unique_identifier. */
  UUID: string;
};

export type Card = {
  __typename?: 'Card';
  archived: Scalars['Boolean'];
  /**
   * Beeminder goal to sync with (goal name in the current user's connected Beeminder account).
   *
   * Can't be queried unless you have edit access to the card.
   */
  beeminderGoal?: Maybe<Scalars['String']>;
  /** Whether the current user can edit this card. */
  canEdit: Scalars['Boolean'];
  /**
   * Subcards of this card.
   *
   * Note: not necessarily in the right order! You have to order them using `childrenOrder`.
   */
  children: Array<Card>;
  childrenOrder: Array<Scalars['UUID']>;
  /**
   * Number of comments on this card.
   *
   * Note: this is a count of *all* comments, not just the ones visible to the current user.
   */
  commentCount: Scalars['Int'];
  comments: Array<Comment>;
  createdAt: Scalars['DateTime'];
  id: Scalars['UUID'];
  owner: User;
  ownerId: Scalars['UUID'];
  parent: Card;
  /** IDs of all cards in the parent chain (first = toplevel), will be `[]` if `parent === null` */
  parentChain: Array<Scalars['UUID']>;
  parentId?: Maybe<Scalars['UUID']>;
  /** Whether to show updates from oldest to newest */
  reverseOrder: Scalars['Boolean'];
  tagline: Scalars['String'];
  title: Scalars['String'];
  visibility: Scalars['String'];
};

export type Comment = {
  __typename?: 'Comment';
  /** Whether the current user can edit this comment. */
  canEdit: Scalars['Boolean'];
  /** The card this comment is attached to. */
  card: Card;
  cardId: Scalars['UUID'];
  /** The content of the comment, as Markdown. */
  content: Scalars['String'];
  createdAt: Scalars['DateTime'];
  id: Scalars['UUID'];
  ownerId: Scalars['UUID'];
  /** Whether the comment is pinned. Several comments can be pinned in the same card. */
  pinned: Scalars['Boolean'];
  visibility: Scalars['String'];
};

export type DeleteCardResult = {
  __typename?: 'DeleteCardResult';
  ownerId: Scalars['UUID'];
  parent?: Maybe<Card>;
};

export type DeleteCommentResult = {
  __typename?: 'DeleteCommentResult';
  card: Card;
};

export type MoveCardResult = {
  __typename?: 'MoveCardResult';
  card: Card;
  newParent?: Maybe<Card>;
  oldParent?: Maybe<Card>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createCard: Card;
  createComment: Comment;
  deleteCard: DeleteCardResult;
  deleteComment: DeleteCommentResult;
  /** Follow a user. */
  followUser: User;
  moveCard: MoveCardResult;
  reorderCardChildren: ReorderCardChildrenResult;
  /** Unfollow a user. */
  unfollowUser: User;
  updateCard: UpdateCardResult;
  updateComment: UpdateCommentResult;
};


export type MutationCreateCardArgs = {
  parentId?: InputMaybe<Scalars['UUID']>;
  private?: InputMaybe<Scalars['Boolean']>;
  title: Scalars['String'];
};


export type MutationCreateCommentArgs = {
  cardId: Scalars['UUID'];
  content: Scalars['String'];
  private?: InputMaybe<Scalars['Boolean']>;
};


export type MutationDeleteCardArgs = {
  id: Scalars['UUID'];
};


export type MutationDeleteCommentArgs = {
  id: Scalars['UUID'];
};


export type MutationFollowUserArgs = {
  id: Scalars['UUID'];
};


export type MutationMoveCardArgs = {
  id: Scalars['UUID'];
  newParentId?: InputMaybe<Scalars['UUID']>;
};


export type MutationReorderCardChildrenArgs = {
  input: ReorderCardChildrenInput;
};


export type MutationUnfollowUserArgs = {
  id: Scalars['UUID'];
};


export type MutationUpdateCardArgs = {
  input: UpdateCardInput;
};


export type MutationUpdateCommentArgs = {
  input: UpdateCommentInput;
};

export type Query = {
  __typename?: 'Query';
  /**
   * Find a card by ID.
   *
   * Throws an error if the card was not found.
   */
  card: Card;
  /** List all visible top-level cards. */
  topLevelCards: Array<Card>;
  /**
   * Find a user by ID.
   *
   * Throws an error if the user was not found.
   */
  user: User;
};


export type QueryCardArgs = {
  id: Scalars['UUID'];
};


export type QueryUserArgs = {
  id: Scalars['UUID'];
};

/**
 * The input for the `reorderCardChildren` mutation.
 *
 * Exactly one of `position`, `before`, or `after` must be provided.
 */
export type ReorderCardChildrenInput = {
  /** The card that the `childId` card should be moved after */
  after?: InputMaybe<Scalars['UUID']>;
  /** The card that the `childId` card should be moved before */
  before?: InputMaybe<Scalars['UUID']>;
  childId: Scalars['UUID'];
  id: Scalars['UUID'];
  /** The new index that the card should have in the board */
  position?: InputMaybe<Scalars['Int']>;
};

export type ReorderCardChildrenResult = {
  __typename?: 'ReorderCardChildrenResult';
  card: Card;
};

export type UpdateCardInput = {
  archived?: InputMaybe<Scalars['Boolean']>;
  beeminderGoal?: InputMaybe<Scalars['String']>;
  id: Scalars['UUID'];
  private?: InputMaybe<Scalars['Boolean']>;
  reverseOrder?: InputMaybe<Scalars['Boolean']>;
  tagline?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export type UpdateCardResult = {
  __typename?: 'UpdateCardResult';
  card: Card;
};

export type UpdateCommentInput = {
  content?: InputMaybe<Scalars['String']>;
  id: Scalars['UUID'];
  pinned?: InputMaybe<Scalars['Boolean']>;
  private?: InputMaybe<Scalars['Boolean']>;
};

export type UpdateCommentResult = {
  __typename?: 'UpdateCommentResult';
  comment: Comment;
};

export type User = {
  __typename?: 'User';
  /** All cards owned by this user, including subcards. */
  allCards: Array<Card>;
  /** The user's Beeminder username. Only available to the user themselves. */
  beeminderUsername?: Maybe<Scalars['String']>;
  displayName: Scalars['String'];
  /** The user's email address. Only available to the user themselves. */
  email: Scalars['String'];
  /** Whether the currently logged-in user is following this user. */
  followed?: Maybe<Scalars['Boolean']>;
  handle: Scalars['String'];
  id: Scalars['UUID'];
  /** Cards that are directly owned by this user. */
  topLevelCards: Array<Card>;
};

export type CreateCommentMutationVariables = Exact<{
  cardId: Scalars['UUID'];
  content: Scalars['String'];
  private: Scalars['Boolean'];
}>;


export type CreateCommentMutation = { __typename?: 'Mutation', createComment: { __typename?: 'Comment', id: string } };

export type GetBoardOwnerQueryVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type GetBoardOwnerQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, displayName: string, handle: string } };

export type GetCardInfoQueryVariables = Exact<{
  id: Scalars['UUID'];
}>;


export type GetCardInfoQuery = { __typename?: 'Query', card: { __typename?: 'Card', title: string, visibility: string } };

export type CreateCardMutationVariables = Exact<{
  parentId: Scalars['UUID'];
  title: Scalars['String'];
  private: Scalars['Boolean'];
}>;


export type CreateCardMutation = { __typename?: 'Mutation', createCard: { __typename?: 'Card', id: string } };

export type ReorderChildMutationVariables = Exact<{
  id: Scalars['UUID'];
  childId: Scalars['UUID'];
  before?: InputMaybe<Scalars['UUID']>;
  after?: InputMaybe<Scalars['UUID']>;
}>;


export type ReorderChildMutation = { __typename?: 'Mutation', reorderCardChildren: { __typename?: 'ReorderCardChildrenResult', card: { __typename?: 'Card', id: string, childrenOrder: Array<string> } } };

export type UpdateCardMutationVariables = Exact<{
  id: Scalars['UUID'];
  archived?: InputMaybe<Scalars['Boolean']>;
  private?: InputMaybe<Scalars['Boolean']>;
}>;


export type UpdateCardMutation = { __typename?: 'Mutation', updateCard: { __typename?: 'UpdateCardResult', card: { __typename?: 'Card', id: string, archived: boolean, visibility: string } } };

export type DeleteCardMutationVariables = Exact<{
  id: Scalars['UUID'];
}>;


export type DeleteCardMutation = { __typename?: 'Mutation', deleteCard: { __typename?: 'DeleteCardResult', ownerId: string, parent?: { __typename?: 'Card', id: string } | null } };

export type UpdateCommentContentMutationVariables = Exact<{
  id: Scalars['UUID'];
  content: Scalars['String'];
}>;


export type UpdateCommentContentMutation = { __typename?: 'Mutation', updateComment: { __typename?: 'UpdateCommentResult', comment: { __typename?: 'Comment', id: string, content: string } } };

export type UpdateCommentMutationVariables = Exact<{
  id: Scalars['UUID'];
  pinned?: InputMaybe<Scalars['Boolean']>;
  private?: InputMaybe<Scalars['Boolean']>;
}>;


export type UpdateCommentMutation = { __typename?: 'Mutation', updateComment: { __typename?: 'UpdateCommentResult', comment: { __typename?: 'Comment', id: string, pinned: boolean, visibility: string } } };

export type DeleteCommentMutationVariables = Exact<{
  id: Scalars['UUID'];
}>;


export type DeleteCommentMutation = { __typename?: 'Mutation', deleteComment: { __typename?: 'DeleteCommentResult', card: { __typename?: 'Card', id: string } } };

export type CreateTopLevelCardMutationVariables = Exact<{
  title: Scalars['String'];
  private: Scalars['Boolean'];
}>;


export type CreateTopLevelCardMutation = { __typename?: 'Mutation', createCard: { __typename?: 'Card', id: string, ownerId: string } };

export type UpdateCard_EditCardModalMutationVariables = Exact<{
  id: Scalars['UUID'];
  title?: InputMaybe<Scalars['String']>;
  tagline?: InputMaybe<Scalars['String']>;
  reverseOrder?: InputMaybe<Scalars['Boolean']>;
  beeminderGoal?: InputMaybe<Scalars['String']>;
}>;


export type UpdateCard_EditCardModalMutation = { __typename?: 'Mutation', updateCard: { __typename?: 'UpdateCardResult', card: { __typename?: 'Card', id: string, title: string, tagline: string, reverseOrder: boolean, beeminderGoal?: string | null } } };

export type GetCardsQueryVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type GetCardsQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, allCards: Array<{ __typename?: 'Card', id: string, title: string }> } };

export type MoveCardMutationVariables = Exact<{
  id: Scalars['UUID'];
  newParentId?: InputMaybe<Scalars['UUID']>;
}>;


export type MoveCardMutation = { __typename?: 'Mutation', moveCard: { __typename?: 'MoveCardResult', card: { __typename?: 'Card', id: string, ownerId: string, parentChain: Array<string> }, oldParent?: { __typename?: 'Card', id: string } | null, newParent?: { __typename?: 'Card', id: string } | null } };

export type GetAllCardsQueryVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type GetAllCardsQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, allCards: Array<{ __typename?: 'Card', id: string, title: string, createdAt: Date }> } };

export type GetTopLevelCardsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetTopLevelCardsQuery = { __typename?: 'Query', topLevelCards: Array<{ __typename?: 'Card', id: string, title: string, ownerId: string, visibility: string }> };

export type FollowUserMutationVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type FollowUserMutation = { __typename?: 'Mutation', followUser: { __typename?: 'User', id: string, followed?: boolean | null } };

export type UnfollowUserMutationVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type UnfollowUserMutation = { __typename?: 'Mutation', unfollowUser: { __typename?: 'User', id: string, followed?: boolean | null } };

export type GetUserQueryVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type GetUserQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, displayName: string, handle: string, followed?: boolean | null, topLevelCards: Array<{ __typename?: 'Card', id: string, title: string, ownerId: string, visibility: string }> } };

export type GetLoggedInUserQueryVariables = Exact<{
  userId: Scalars['UUID'];
}>;


export type GetLoggedInUserQuery = { __typename?: 'Query', user: { __typename?: 'User', id: string, displayName: string, handle: string, beeminderUsername?: string | null } };

export type GetCardQueryVariables = Exact<{
  id: Scalars['UUID'];
}>;


export type GetCardQuery = { __typename?: 'Query', card: { __typename?: 'Card', id: string, title: string, tagline: string, visibility: string, parentId?: string | null, canEdit: boolean, archived: boolean, reverseOrder: boolean, parentChain: Array<string>, childrenOrder: Array<string>, children: Array<{ __typename?: 'Card', id: string, title: string, visibility: string, tagline: string, archived: boolean, commentCount: number }>, owner: { __typename?: 'User', id: string, handle: string } } };

export type GetCommentsQueryVariables = Exact<{
  cardId: Scalars['UUID'];
}>;


export type GetCommentsQuery = { __typename?: 'Query', card: { __typename?: 'Card', id: string, comments: Array<{ __typename?: 'Comment', id: string, content: string, createdAt: Date, visibility: string, pinned: boolean, canEdit: boolean }> } };


export const CreateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"private"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"cardId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cardId"}}},{"kind":"Argument","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}},{"kind":"Argument","name":{"kind":"Name","value":"private"},"value":{"kind":"Variable","name":{"kind":"Name","value":"private"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateCommentMutation, CreateCommentMutationVariables>;
export const GetBoardOwnerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getBoardOwner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}}]}}]} as unknown as DocumentNode<GetBoardOwnerQuery, GetBoardOwnerQueryVariables>;
export const GetCardInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCardInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]} as unknown as DocumentNode<GetCardInfoQuery, GetCardInfoQueryVariables>;
export const CreateCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"private"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"private"},"value":{"kind":"Variable","name":{"kind":"Name","value":"private"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateCardMutation, CreateCardMutationVariables>;
export const ReorderChildDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"reorderChild"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"childId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"before"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reorderCardChildren"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"childId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"childId"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"before"},"value":{"kind":"Variable","name":{"kind":"Name","value":"before"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"childrenOrder"}}]}}]}}]}}]} as unknown as DocumentNode<ReorderChildMutation, ReorderChildMutationVariables>;
export const UpdateCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"archived"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"private"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"archived"},"value":{"kind":"Variable","name":{"kind":"Name","value":"archived"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"private"},"value":{"kind":"Variable","name":{"kind":"Name","value":"private"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCardMutation, UpdateCardMutationVariables>;
export const DeleteCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}}]}}]} as unknown as DocumentNode<DeleteCardMutation, DeleteCardMutationVariables>;
export const UpdateCommentContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateCommentContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"content"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"content"},"value":{"kind":"Variable","name":{"kind":"Name","value":"content"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCommentContentMutation, UpdateCommentContentMutationVariables>;
export const UpdateCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"private"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"pinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pinned"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"private"},"value":{"kind":"Variable","name":{"kind":"Name","value":"private"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"comment"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCommentMutation, UpdateCommentMutationVariables>;
export const DeleteCommentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"deleteComment"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteComment"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteCommentMutation, DeleteCommentMutationVariables>;
export const CreateTopLevelCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"createTopLevelCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"private"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"Argument","name":{"kind":"Name","value":"private"},"value":{"kind":"Variable","name":{"kind":"Name","value":"private"}}},{"kind":"Argument","name":{"kind":"Name","value":"parentId"},"value":{"kind":"NullValue"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}}]}}]}}]} as unknown as DocumentNode<CreateTopLevelCardMutation, CreateTopLevelCardMutationVariables>;
export const UpdateCard_EditCardModalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"updateCard_EditCardModal"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"title"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagline"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"reverseOrder"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"beeminderGoal"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"title"},"value":{"kind":"Variable","name":{"kind":"Name","value":"title"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"tagline"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagline"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"reverseOrder"},"value":{"kind":"Variable","name":{"kind":"Name","value":"reverseOrder"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"beeminderGoal"},"value":{"kind":"Variable","name":{"kind":"Name","value":"beeminderGoal"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tagline"}},{"kind":"Field","name":{"kind":"Name","value":"reverseOrder"}},{"kind":"Field","name":{"kind":"Name","value":"beeminderGoal"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCard_EditCardModalMutation, UpdateCard_EditCardModalMutationVariables>;
export const GetCardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCards"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"allCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]}}]} as unknown as DocumentNode<GetCardsQuery, GetCardsQueryVariables>;
export const MoveCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"moveCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newParentId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"moveCard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"newParentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newParentId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"parentChain"}}]}},{"kind":"Field","name":{"kind":"Name","value":"oldParent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"newParent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MoveCardMutation, MoveCardMutationVariables>;
export const GetAllCardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getAllCards"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"allCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<GetAllCardsQuery, GetAllCardsQueryVariables>;
export const GetTopLevelCardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getTopLevelCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topLevelCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]} as unknown as DocumentNode<GetTopLevelCardsQuery, GetTopLevelCardsQueryVariables>;
export const FollowUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"followUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"followUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"followed"}}]}}]}}]} as unknown as DocumentNode<FollowUserMutation, FollowUserMutationVariables>;
export const UnfollowUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"unfollowUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unfollowUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"followed"}}]}}]}}]} as unknown as DocumentNode<UnfollowUserMutation, UnfollowUserMutationVariables>;
export const GetUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}},{"kind":"Field","name":{"kind":"Name","value":"followed"}},{"kind":"Field","name":{"kind":"Name","value":"topLevelCards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"ownerId"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}}]}}]}}]}}]} as unknown as DocumentNode<GetUserQuery, GetUserQueryVariables>;
export const GetLoggedInUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getLoggedInUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}},{"kind":"Field","name":{"kind":"Name","value":"beeminderUsername"}}]}}]}}]} as unknown as DocumentNode<GetLoggedInUserQuery, GetLoggedInUserQueryVariables>;
export const GetCardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getCard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tagline"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"parentId"}},{"kind":"Field","name":{"kind":"Name","value":"canEdit"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"reverseOrder"}},{"kind":"Field","name":{"kind":"Name","value":"parentChain"}},{"kind":"Field","name":{"kind":"Name","value":"childrenOrder"}},{"kind":"Field","name":{"kind":"Name","value":"children"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"tagline"}},{"kind":"Field","name":{"kind":"Name","value":"archived"}},{"kind":"Field","name":{"kind":"Name","value":"commentCount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}}]}}]}}]} as unknown as DocumentNode<GetCardQuery, GetCardQueryVariables>;
export const GetCommentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getComments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cardId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"card"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cardId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"comments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"pinned"}},{"kind":"Field","name":{"kind":"Name","value":"canEdit"}}]}}]}}]}}]} as unknown as DocumentNode<GetCommentsQuery, GetCommentsQueryVariables>;