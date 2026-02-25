import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type Mutation = {
  __typename?: 'Mutation';
  addSaleComment: SaleComment;
  addSaleTag: Sale;
  removeSaleTag: Sale;
  setSaleFilledBy: Sale;
  updateSaleDelay: Sale;
  updateSaleProblem: Sale;
  updateSaleStatus: Sale;
};


export type MutationAddSaleCommentArgs = {
  comment: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


export type MutationAddSaleTagArgs = {
  id: Scalars['ID']['input'];
  tag_name: Scalars['String']['input'];
};


export type MutationRemoveSaleTagArgs = {
  id: Scalars['ID']['input'];
  tag_name: Scalars['String']['input'];
};


export type MutationSetSaleFilledByArgs = {
  id: Scalars['ID']['input'];
  user_id: Scalars['ID']['input'];
};


export type MutationUpdateSaleDelayArgs = {
  delivery_delay_at?: InputMaybe<Scalars['DateTime']['input']>;
  expected_updated_at?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateSaleProblemArgs = {
  expected_updated_at?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  problem_reason?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateSaleStatusArgs = {
  expected_updated_at?: InputMaybe<Scalars['DateTime']['input']>;
  id: Scalars['ID']['input'];
  status: SaleStatus;
};

export type PaginationInput = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type Query = {
  __typename?: 'Query';
  delayedSales: SaleListPayload;
  listUsersForAssignment: Array<User>;
  saleById?: Maybe<Sale>;
  salesList: SaleListPayload;
};


export type QueryDelayedSalesArgs = {
  filter?: InputMaybe<SaleFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SaleSortInput>;
};


export type QuerySaleByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySalesListArgs = {
  filter?: InputMaybe<SaleFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SaleSortInput>;
};

export type Sale = {
  __typename?: 'Sale';
  buyerEmail?: Maybe<Scalars['String']['output']>;
  comments: Array<SaleComment>;
  createdAt: Scalars['DateTime']['output'];
  currency?: Maybe<Scalars['String']['output']>;
  deliveryDelayAt?: Maybe<Scalars['DateTime']['output']>;
  eventId?: Maybe<Scalars['String']['output']>;
  externalSaleId: Scalars['String']['output'];
  filledBy?: Maybe<User>;
  id: Scalars['ID']['output'];
  listingId?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  problemReason?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['Int']['output']>;
  sourcePayload?: Maybe<Scalars['JSON']['output']>;
  status: SaleStatus;
  tags: Array<SaleTag>;
  updatedAt: Scalars['DateTime']['output'];
};

export type SaleComment = {
  __typename?: 'SaleComment';
  author: Scalars['String']['output'];
  comment: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
};

export type SaleFilterInput = {
  has_delay?: InputMaybe<Scalars['Boolean']['input']>;
  overdue_only?: InputMaybe<Scalars['Boolean']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<SaleStatus>;
  tagIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type SaleListPayload = {
  __typename?: 'SaleListPayload';
  items: Array<Sale>;
  totalCount: Scalars['Int']['output'];
};

export type SaleSortField =
  | 'created_at'
  | 'delivery_delay_at'
  | 'status'
  | 'updated_at';

export type SaleSortInput = {
  direction: SortDirection;
  field: SaleSortField;
};

export type SaleStatus =
  | 'COMPLETED'
  | 'DELAYED'
  | 'PROBLEM'
  | 'RECEIVED';

export type SaleTag = {
  __typename?: 'SaleTag';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type User = {
  __typename?: 'User';
  authSub?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
};

export type UpdateSaleStatusMutation_updateSaleStatus_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type UpdateSaleStatusMutation_updateSaleStatus_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type UpdateSaleStatusMutation_updateSaleStatus_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type UpdateSaleStatusMutation_updateSaleStatus_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: UpdateSaleStatusMutation_updateSaleStatus_Sale_filledBy_User | null | undefined, tags: Array<UpdateSaleStatusMutation_updateSaleStatus_Sale_tags_SaleTag>, comments: Array<UpdateSaleStatusMutation_updateSaleStatus_Sale_comments_SaleComment> };

export type UpdateSaleStatusMutation_Mutation = { __typename?: 'Mutation', updateSaleStatus: UpdateSaleStatusMutation_updateSaleStatus_Sale };


export type UpdateSaleStatusMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  status: SaleStatus;
  expectedUpdatedAt?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type UpdateSaleStatusMutation = UpdateSaleStatusMutation_Mutation;

export type UpdateSaleDelayMutation_updateSaleDelay_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type UpdateSaleDelayMutation_updateSaleDelay_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type UpdateSaleDelayMutation_updateSaleDelay_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type UpdateSaleDelayMutation_updateSaleDelay_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: UpdateSaleDelayMutation_updateSaleDelay_Sale_filledBy_User | null | undefined, tags: Array<UpdateSaleDelayMutation_updateSaleDelay_Sale_tags_SaleTag>, comments: Array<UpdateSaleDelayMutation_updateSaleDelay_Sale_comments_SaleComment> };

export type UpdateSaleDelayMutation_Mutation = { __typename?: 'Mutation', updateSaleDelay: UpdateSaleDelayMutation_updateSaleDelay_Sale };


export type UpdateSaleDelayMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  deliveryDelayAt?: InputMaybe<Scalars['DateTime']['input']>;
  expectedUpdatedAt?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type UpdateSaleDelayMutation = UpdateSaleDelayMutation_Mutation;

export type UpdateSaleProblemMutation_updateSaleProblem_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type UpdateSaleProblemMutation_updateSaleProblem_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type UpdateSaleProblemMutation_updateSaleProblem_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type UpdateSaleProblemMutation_updateSaleProblem_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: UpdateSaleProblemMutation_updateSaleProblem_Sale_filledBy_User | null | undefined, tags: Array<UpdateSaleProblemMutation_updateSaleProblem_Sale_tags_SaleTag>, comments: Array<UpdateSaleProblemMutation_updateSaleProblem_Sale_comments_SaleComment> };

export type UpdateSaleProblemMutation_Mutation = { __typename?: 'Mutation', updateSaleProblem: UpdateSaleProblemMutation_updateSaleProblem_Sale };


export type UpdateSaleProblemMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  problemReason?: InputMaybe<Scalars['String']['input']>;
  expectedUpdatedAt?: InputMaybe<Scalars['DateTime']['input']>;
}>;


export type UpdateSaleProblemMutation = UpdateSaleProblemMutation_Mutation;

export type AddSaleTagMutation_addSaleTag_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type AddSaleTagMutation_addSaleTag_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type AddSaleTagMutation_addSaleTag_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type AddSaleTagMutation_addSaleTag_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: AddSaleTagMutation_addSaleTag_Sale_filledBy_User | null | undefined, tags: Array<AddSaleTagMutation_addSaleTag_Sale_tags_SaleTag>, comments: Array<AddSaleTagMutation_addSaleTag_Sale_comments_SaleComment> };

export type AddSaleTagMutation_Mutation = { __typename?: 'Mutation', addSaleTag: AddSaleTagMutation_addSaleTag_Sale };


export type AddSaleTagMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  tagName: Scalars['String']['input'];
}>;


export type AddSaleTagMutation = AddSaleTagMutation_Mutation;

export type RemoveSaleTagMutation_removeSaleTag_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type RemoveSaleTagMutation_removeSaleTag_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type RemoveSaleTagMutation_removeSaleTag_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type RemoveSaleTagMutation_removeSaleTag_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: RemoveSaleTagMutation_removeSaleTag_Sale_filledBy_User | null | undefined, tags: Array<RemoveSaleTagMutation_removeSaleTag_Sale_tags_SaleTag>, comments: Array<RemoveSaleTagMutation_removeSaleTag_Sale_comments_SaleComment> };

export type RemoveSaleTagMutation_Mutation = { __typename?: 'Mutation', removeSaleTag: RemoveSaleTagMutation_removeSaleTag_Sale };


export type RemoveSaleTagMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  tagName: Scalars['String']['input'];
}>;


export type RemoveSaleTagMutation = RemoveSaleTagMutation_Mutation;

export type AddSaleCommentMutation_addSaleComment_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type AddSaleCommentMutation_Mutation = { __typename?: 'Mutation', addSaleComment: AddSaleCommentMutation_addSaleComment_SaleComment };


export type AddSaleCommentMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  comment: Scalars['String']['input'];
}>;


export type AddSaleCommentMutation = AddSaleCommentMutation_Mutation;

export type SetSaleFilledByMutation_setSaleFilledBy_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type SetSaleFilledByMutation_setSaleFilledBy_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type SetSaleFilledByMutation_setSaleFilledBy_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type SetSaleFilledByMutation_setSaleFilledBy_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: SetSaleFilledByMutation_setSaleFilledBy_Sale_filledBy_User | null | undefined, tags: Array<SetSaleFilledByMutation_setSaleFilledBy_Sale_tags_SaleTag>, comments: Array<SetSaleFilledByMutation_setSaleFilledBy_Sale_comments_SaleComment> };

export type SetSaleFilledByMutation_Mutation = { __typename?: 'Mutation', setSaleFilledBy: SetSaleFilledByMutation_setSaleFilledBy_Sale };


export type SetSaleFilledByMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
}>;


export type SetSaleFilledByMutation = SetSaleFilledByMutation_Mutation;

export type SalesListQuery_salesList_SaleListPayload_items_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type SalesListQuery_salesList_SaleListPayload_items_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type SalesListQuery_salesList_SaleListPayload_items_Sale_filledBy_User = { __typename?: 'User', id: string, fullName: string, firstName?: string | null | undefined, lastName?: string | null | undefined };

export type SalesListQuery_salesList_SaleListPayload_items_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, tags: Array<SalesListQuery_salesList_SaleListPayload_items_Sale_tags_SaleTag>, comments: Array<SalesListQuery_salesList_SaleListPayload_items_Sale_comments_SaleComment>, filledBy?: SalesListQuery_salesList_SaleListPayload_items_Sale_filledBy_User | null | undefined };

export type SalesListQuery_salesList_SaleListPayload = { __typename?: 'SaleListPayload', totalCount: number, items: Array<SalesListQuery_salesList_SaleListPayload_items_Sale> };

export type SalesListQuery_Query = { __typename?: 'Query', salesList: SalesListQuery_salesList_SaleListPayload };


export type SalesListQueryVariables = Exact<{
  filter?: InputMaybe<SaleFilterInput>;
  sort?: InputMaybe<SaleSortInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type SalesListQuery = SalesListQuery_Query;

export type SaleByIdQuery_saleById_Sale_filledBy_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type SaleByIdQuery_saleById_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type SaleByIdQuery_saleById_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type SaleByIdQuery_saleById_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, filledBy?: SaleByIdQuery_saleById_Sale_filledBy_User | null | undefined, tags: Array<SaleByIdQuery_saleById_Sale_tags_SaleTag>, comments: Array<SaleByIdQuery_saleById_Sale_comments_SaleComment> };

export type SaleByIdQuery_Query = { __typename?: 'Query', saleById?: SaleByIdQuery_saleById_Sale | null | undefined };


export type SaleByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SaleByIdQuery = SaleByIdQuery_Query;

export type DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale_tags_SaleTag = { __typename?: 'SaleTag', id: string, name: string };

export type DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale_comments_SaleComment = { __typename?: 'SaleComment', id: string, author: string, comment: string, createdAt: any };

export type DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale_filledBy_User = { __typename?: 'User', id: string, fullName: string, firstName?: string | null | undefined, lastName?: string | null | undefined };

export type DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale = { __typename?: 'Sale', id: string, externalSaleId: string, listingId?: string | null | undefined, eventId?: string | null | undefined, status: SaleStatus, deliveryDelayAt?: any | null | undefined, problemReason?: string | null | undefined, sourcePayload?: any | null | undefined, createdAt: any, updatedAt: any, tags: Array<DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale_tags_SaleTag>, comments: Array<DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale_comments_SaleComment>, filledBy?: DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale_filledBy_User | null | undefined };

export type DelayedSalesQuery_delayedSales_SaleListPayload = { __typename?: 'SaleListPayload', totalCount: number, items: Array<DelayedSalesQuery_delayedSales_SaleListPayload_items_Sale> };

export type DelayedSalesQuery_Query = { __typename?: 'Query', delayedSales: DelayedSalesQuery_delayedSales_SaleListPayload };


export type DelayedSalesQueryVariables = Exact<{
  filter?: InputMaybe<SaleFilterInput>;
  sort?: InputMaybe<SaleSortInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type DelayedSalesQuery = DelayedSalesQuery_Query;

export type ListUsersForAssignmentQuery_listUsersForAssignment_User = { __typename?: 'User', id: string, authSub?: string | null | undefined, firstName?: string | null | undefined, lastName?: string | null | undefined, fullName: string };

export type ListUsersForAssignmentQuery_Query = { __typename?: 'Query', listUsersForAssignment: Array<ListUsersForAssignmentQuery_listUsersForAssignment_User> };


export type ListUsersForAssignmentQueryVariables = Exact<{ [key: string]: never; }>;


export type ListUsersForAssignmentQuery = ListUsersForAssignmentQuery_Query;


export const UpdateSaleStatusDocument = gql`
    mutation UpdateSaleStatus($id: ID!, $status: SaleStatus!, $expectedUpdatedAt: DateTime) {
  updateSaleStatus(
    id: $id
    status: $status
    expected_updated_at: $expectedUpdatedAt
  ) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;
export type UpdateSaleStatusMutationFn = Apollo.MutationFunction<UpdateSaleStatusMutation, UpdateSaleStatusMutationVariables>;

/**
 * __useUpdateSaleStatusMutation__
 *
 * To run a mutation, you first call `useUpdateSaleStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSaleStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSaleStatusMutation, { data, loading, error }] = useUpdateSaleStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *      expectedUpdatedAt: // value for 'expectedUpdatedAt'
 *   },
 * });
 */
export function useUpdateSaleStatusMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSaleStatusMutation, UpdateSaleStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSaleStatusMutation, UpdateSaleStatusMutationVariables>(UpdateSaleStatusDocument, options);
      }
export type UpdateSaleStatusMutationHookResult = ReturnType<typeof useUpdateSaleStatusMutation>;
export type UpdateSaleStatusMutationResult = Apollo.MutationResult<UpdateSaleStatusMutation>;
export type UpdateSaleStatusMutationOptions = Apollo.BaseMutationOptions<UpdateSaleStatusMutation, UpdateSaleStatusMutationVariables>;
export const UpdateSaleDelayDocument = gql`
    mutation UpdateSaleDelay($id: ID!, $deliveryDelayAt: DateTime, $expectedUpdatedAt: DateTime) {
  updateSaleDelay(
    id: $id
    delivery_delay_at: $deliveryDelayAt
    expected_updated_at: $expectedUpdatedAt
  ) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;
export type UpdateSaleDelayMutationFn = Apollo.MutationFunction<UpdateSaleDelayMutation, UpdateSaleDelayMutationVariables>;

/**
 * __useUpdateSaleDelayMutation__
 *
 * To run a mutation, you first call `useUpdateSaleDelayMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSaleDelayMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSaleDelayMutation, { data, loading, error }] = useUpdateSaleDelayMutation({
 *   variables: {
 *      id: // value for 'id'
 *      deliveryDelayAt: // value for 'deliveryDelayAt'
 *      expectedUpdatedAt: // value for 'expectedUpdatedAt'
 *   },
 * });
 */
export function useUpdateSaleDelayMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSaleDelayMutation, UpdateSaleDelayMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSaleDelayMutation, UpdateSaleDelayMutationVariables>(UpdateSaleDelayDocument, options);
      }
export type UpdateSaleDelayMutationHookResult = ReturnType<typeof useUpdateSaleDelayMutation>;
export type UpdateSaleDelayMutationResult = Apollo.MutationResult<UpdateSaleDelayMutation>;
export type UpdateSaleDelayMutationOptions = Apollo.BaseMutationOptions<UpdateSaleDelayMutation, UpdateSaleDelayMutationVariables>;
export const UpdateSaleProblemDocument = gql`
    mutation UpdateSaleProblem($id: ID!, $problemReason: String, $expectedUpdatedAt: DateTime) {
  updateSaleProblem(
    id: $id
    problem_reason: $problemReason
    expected_updated_at: $expectedUpdatedAt
  ) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;
export type UpdateSaleProblemMutationFn = Apollo.MutationFunction<UpdateSaleProblemMutation, UpdateSaleProblemMutationVariables>;

/**
 * __useUpdateSaleProblemMutation__
 *
 * To run a mutation, you first call `useUpdateSaleProblemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSaleProblemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSaleProblemMutation, { data, loading, error }] = useUpdateSaleProblemMutation({
 *   variables: {
 *      id: // value for 'id'
 *      problemReason: // value for 'problemReason'
 *      expectedUpdatedAt: // value for 'expectedUpdatedAt'
 *   },
 * });
 */
export function useUpdateSaleProblemMutation(baseOptions?: Apollo.MutationHookOptions<UpdateSaleProblemMutation, UpdateSaleProblemMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateSaleProblemMutation, UpdateSaleProblemMutationVariables>(UpdateSaleProblemDocument, options);
      }
export type UpdateSaleProblemMutationHookResult = ReturnType<typeof useUpdateSaleProblemMutation>;
export type UpdateSaleProblemMutationResult = Apollo.MutationResult<UpdateSaleProblemMutation>;
export type UpdateSaleProblemMutationOptions = Apollo.BaseMutationOptions<UpdateSaleProblemMutation, UpdateSaleProblemMutationVariables>;
export const AddSaleTagDocument = gql`
    mutation AddSaleTag($id: ID!, $tagName: String!) {
  addSaleTag(id: $id, tag_name: $tagName) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;
export type AddSaleTagMutationFn = Apollo.MutationFunction<AddSaleTagMutation, AddSaleTagMutationVariables>;

/**
 * __useAddSaleTagMutation__
 *
 * To run a mutation, you first call `useAddSaleTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddSaleTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addSaleTagMutation, { data, loading, error }] = useAddSaleTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *      tagName: // value for 'tagName'
 *   },
 * });
 */
export function useAddSaleTagMutation(baseOptions?: Apollo.MutationHookOptions<AddSaleTagMutation, AddSaleTagMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddSaleTagMutation, AddSaleTagMutationVariables>(AddSaleTagDocument, options);
      }
export type AddSaleTagMutationHookResult = ReturnType<typeof useAddSaleTagMutation>;
export type AddSaleTagMutationResult = Apollo.MutationResult<AddSaleTagMutation>;
export type AddSaleTagMutationOptions = Apollo.BaseMutationOptions<AddSaleTagMutation, AddSaleTagMutationVariables>;
export const RemoveSaleTagDocument = gql`
    mutation RemoveSaleTag($id: ID!, $tagName: String!) {
  removeSaleTag(id: $id, tag_name: $tagName) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;
export type RemoveSaleTagMutationFn = Apollo.MutationFunction<RemoveSaleTagMutation, RemoveSaleTagMutationVariables>;

/**
 * __useRemoveSaleTagMutation__
 *
 * To run a mutation, you first call `useRemoveSaleTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveSaleTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeSaleTagMutation, { data, loading, error }] = useRemoveSaleTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *      tagName: // value for 'tagName'
 *   },
 * });
 */
export function useRemoveSaleTagMutation(baseOptions?: Apollo.MutationHookOptions<RemoveSaleTagMutation, RemoveSaleTagMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveSaleTagMutation, RemoveSaleTagMutationVariables>(RemoveSaleTagDocument, options);
      }
export type RemoveSaleTagMutationHookResult = ReturnType<typeof useRemoveSaleTagMutation>;
export type RemoveSaleTagMutationResult = Apollo.MutationResult<RemoveSaleTagMutation>;
export type RemoveSaleTagMutationOptions = Apollo.BaseMutationOptions<RemoveSaleTagMutation, RemoveSaleTagMutationVariables>;
export const AddSaleCommentDocument = gql`
    mutation AddSaleComment($id: ID!, $comment: String!) {
  addSaleComment(id: $id, comment: $comment) {
    id
    author
    comment
    createdAt
  }
}
    `;
export type AddSaleCommentMutationFn = Apollo.MutationFunction<AddSaleCommentMutation, AddSaleCommentMutationVariables>;

/**
 * __useAddSaleCommentMutation__
 *
 * To run a mutation, you first call `useAddSaleCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddSaleCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addSaleCommentMutation, { data, loading, error }] = useAddSaleCommentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      comment: // value for 'comment'
 *   },
 * });
 */
export function useAddSaleCommentMutation(baseOptions?: Apollo.MutationHookOptions<AddSaleCommentMutation, AddSaleCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddSaleCommentMutation, AddSaleCommentMutationVariables>(AddSaleCommentDocument, options);
      }
export type AddSaleCommentMutationHookResult = ReturnType<typeof useAddSaleCommentMutation>;
export type AddSaleCommentMutationResult = Apollo.MutationResult<AddSaleCommentMutation>;
export type AddSaleCommentMutationOptions = Apollo.BaseMutationOptions<AddSaleCommentMutation, AddSaleCommentMutationVariables>;
export const SetSaleFilledByDocument = gql`
    mutation SetSaleFilledBy($id: ID!, $userId: ID!) {
  setSaleFilledBy(id: $id, user_id: $userId) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;
export type SetSaleFilledByMutationFn = Apollo.MutationFunction<SetSaleFilledByMutation, SetSaleFilledByMutationVariables>;

/**
 * __useSetSaleFilledByMutation__
 *
 * To run a mutation, you first call `useSetSaleFilledByMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetSaleFilledByMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setSaleFilledByMutation, { data, loading, error }] = useSetSaleFilledByMutation({
 *   variables: {
 *      id: // value for 'id'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useSetSaleFilledByMutation(baseOptions?: Apollo.MutationHookOptions<SetSaleFilledByMutation, SetSaleFilledByMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetSaleFilledByMutation, SetSaleFilledByMutationVariables>(SetSaleFilledByDocument, options);
      }
export type SetSaleFilledByMutationHookResult = ReturnType<typeof useSetSaleFilledByMutation>;
export type SetSaleFilledByMutationResult = Apollo.MutationResult<SetSaleFilledByMutation>;
export type SetSaleFilledByMutationOptions = Apollo.BaseMutationOptions<SetSaleFilledByMutation, SetSaleFilledByMutationVariables>;
export const SalesListDocument = gql`
    query SalesList($filter: SaleFilterInput, $sort: SaleSortInput, $pagination: PaginationInput) {
  salesList(filter: $filter, sort: $sort, pagination: $pagination) {
    items {
      id
      externalSaleId
      listingId
      eventId
      status
      deliveryDelayAt
      problemReason
      sourcePayload
      createdAt
      updatedAt
      tags {
        id
        name
      }
      comments {
        id
        author
        comment
        createdAt
      }
      filledBy {
        id
        fullName
        firstName
        lastName
      }
    }
    totalCount
  }
}
    `;

/**
 * __useSalesListQuery__
 *
 * To run a query within a React component, call `useSalesListQuery` and pass it any options that fit your needs.
 * When your component renders, `useSalesListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSalesListQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      sort: // value for 'sort'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useSalesListQuery(baseOptions?: Apollo.QueryHookOptions<SalesListQuery, SalesListQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SalesListQuery, SalesListQueryVariables>(SalesListDocument, options);
      }
export function useSalesListLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SalesListQuery, SalesListQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SalesListQuery, SalesListQueryVariables>(SalesListDocument, options);
        }
// @ts-ignore
export function useSalesListSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SalesListQuery, SalesListQueryVariables>): Apollo.UseSuspenseQueryResult<SalesListQuery, SalesListQueryVariables>;
export function useSalesListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SalesListQuery, SalesListQueryVariables>): Apollo.UseSuspenseQueryResult<SalesListQuery | undefined, SalesListQueryVariables>;
export function useSalesListSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SalesListQuery, SalesListQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SalesListQuery, SalesListQueryVariables>(SalesListDocument, options);
        }
export type SalesListQueryHookResult = ReturnType<typeof useSalesListQuery>;
export type SalesListLazyQueryHookResult = ReturnType<typeof useSalesListLazyQuery>;
export type SalesListSuspenseQueryHookResult = ReturnType<typeof useSalesListSuspenseQuery>;
export type SalesListQueryResult = Apollo.QueryResult<SalesListQuery, SalesListQueryVariables>;
export const SaleByIdDocument = gql`
    query SaleById($id: ID!) {
  saleById(id: $id) {
    id
    externalSaleId
    listingId
    eventId
    status
    deliveryDelayAt
    problemReason
    sourcePayload
    createdAt
    updatedAt
    filledBy {
      id
      authSub
      firstName
      lastName
      fullName
    }
    tags {
      id
      name
    }
    comments {
      id
      author
      comment
      createdAt
    }
  }
}
    `;

/**
 * __useSaleByIdQuery__
 *
 * To run a query within a React component, call `useSaleByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useSaleByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSaleByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSaleByIdQuery(baseOptions: Apollo.QueryHookOptions<SaleByIdQuery, SaleByIdQueryVariables> & ({ variables: SaleByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SaleByIdQuery, SaleByIdQueryVariables>(SaleByIdDocument, options);
      }
export function useSaleByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SaleByIdQuery, SaleByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SaleByIdQuery, SaleByIdQueryVariables>(SaleByIdDocument, options);
        }
// @ts-ignore
export function useSaleByIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<SaleByIdQuery, SaleByIdQueryVariables>): Apollo.UseSuspenseQueryResult<SaleByIdQuery, SaleByIdQueryVariables>;
export function useSaleByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SaleByIdQuery, SaleByIdQueryVariables>): Apollo.UseSuspenseQueryResult<SaleByIdQuery | undefined, SaleByIdQueryVariables>;
export function useSaleByIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SaleByIdQuery, SaleByIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<SaleByIdQuery, SaleByIdQueryVariables>(SaleByIdDocument, options);
        }
export type SaleByIdQueryHookResult = ReturnType<typeof useSaleByIdQuery>;
export type SaleByIdLazyQueryHookResult = ReturnType<typeof useSaleByIdLazyQuery>;
export type SaleByIdSuspenseQueryHookResult = ReturnType<typeof useSaleByIdSuspenseQuery>;
export type SaleByIdQueryResult = Apollo.QueryResult<SaleByIdQuery, SaleByIdQueryVariables>;
export const DelayedSalesDocument = gql`
    query DelayedSales($filter: SaleFilterInput, $sort: SaleSortInput, $pagination: PaginationInput) {
  delayedSales(filter: $filter, sort: $sort, pagination: $pagination) {
    items {
      id
      externalSaleId
      listingId
      eventId
      status
      deliveryDelayAt
      problemReason
      sourcePayload
      createdAt
      updatedAt
      tags {
        id
        name
      }
      comments {
        id
        author
        comment
        createdAt
      }
      filledBy {
        id
        fullName
        firstName
        lastName
      }
    }
    totalCount
  }
}
    `;

/**
 * __useDelayedSalesQuery__
 *
 * To run a query within a React component, call `useDelayedSalesQuery` and pass it any options that fit your needs.
 * When your component renders, `useDelayedSalesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDelayedSalesQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      sort: // value for 'sort'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useDelayedSalesQuery(baseOptions?: Apollo.QueryHookOptions<DelayedSalesQuery, DelayedSalesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DelayedSalesQuery, DelayedSalesQueryVariables>(DelayedSalesDocument, options);
      }
export function useDelayedSalesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DelayedSalesQuery, DelayedSalesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DelayedSalesQuery, DelayedSalesQueryVariables>(DelayedSalesDocument, options);
        }
// @ts-ignore
export function useDelayedSalesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DelayedSalesQuery, DelayedSalesQueryVariables>): Apollo.UseSuspenseQueryResult<DelayedSalesQuery, DelayedSalesQueryVariables>;
export function useDelayedSalesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DelayedSalesQuery, DelayedSalesQueryVariables>): Apollo.UseSuspenseQueryResult<DelayedSalesQuery | undefined, DelayedSalesQueryVariables>;
export function useDelayedSalesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DelayedSalesQuery, DelayedSalesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DelayedSalesQuery, DelayedSalesQueryVariables>(DelayedSalesDocument, options);
        }
export type DelayedSalesQueryHookResult = ReturnType<typeof useDelayedSalesQuery>;
export type DelayedSalesLazyQueryHookResult = ReturnType<typeof useDelayedSalesLazyQuery>;
export type DelayedSalesSuspenseQueryHookResult = ReturnType<typeof useDelayedSalesSuspenseQuery>;
export type DelayedSalesQueryResult = Apollo.QueryResult<DelayedSalesQuery, DelayedSalesQueryVariables>;
export const ListUsersForAssignmentDocument = gql`
    query ListUsersForAssignment {
  listUsersForAssignment {
    id
    authSub
    firstName
    lastName
    fullName
  }
}
    `;

/**
 * __useListUsersForAssignmentQuery__
 *
 * To run a query within a React component, call `useListUsersForAssignmentQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUsersForAssignmentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUsersForAssignmentQuery({
 *   variables: {
 *   },
 * });
 */
export function useListUsersForAssignmentQuery(baseOptions?: Apollo.QueryHookOptions<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>(ListUsersForAssignmentDocument, options);
      }
export function useListUsersForAssignmentLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>(ListUsersForAssignmentDocument, options);
        }
// @ts-ignore
export function useListUsersForAssignmentSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>;
export function useListUsersForAssignmentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>): Apollo.UseSuspenseQueryResult<ListUsersForAssignmentQuery | undefined, ListUsersForAssignmentQueryVariables>;
export function useListUsersForAssignmentSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>(ListUsersForAssignmentDocument, options);
        }
export type ListUsersForAssignmentQueryHookResult = ReturnType<typeof useListUsersForAssignmentQuery>;
export type ListUsersForAssignmentLazyQueryHookResult = ReturnType<typeof useListUsersForAssignmentLazyQuery>;
export type ListUsersForAssignmentSuspenseQueryHookResult = ReturnType<typeof useListUsersForAssignmentSuspenseQuery>;
export type ListUsersForAssignmentQueryResult = Apollo.QueryResult<ListUsersForAssignmentQuery, ListUsersForAssignmentQueryVariables>;