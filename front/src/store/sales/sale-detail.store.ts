import {
  type Sale,
  type SaleComment,
  type SaleStatus,
  useAddSaleCommentMutation,
  useAddSaleTagMutation,
  useListUsersForAssignmentQuery,
  useRemoveSaleTagMutation,
  useSetSaleFilledByMutation,
  useUpdateSaleDelayMutation,
  useUpdateSaleProblemMutation,
  useUpdateSaleStatusMutation,
} from '@/generated/graphql';

type SaleUpdateResult = {
  sale: Sale | null;
};

type AddCommentResult = {
  comment: SaleComment | null;
};

type MutationState = {
  updateStatus: (id: string, status: SaleStatus) => Promise<SaleUpdateResult>;
  updateDelay: (id: string, deliveryDelayAt: string | null) => Promise<SaleUpdateResult>;
  updateProblem: (id: string, problemReason: string | null) => Promise<SaleUpdateResult>;
  addTag: (id: string, tagName: string) => Promise<SaleUpdateResult>;
  removeTag: (id: string, tagName: string) => Promise<SaleUpdateResult>;
  assignOwner: (id: string, userId: string) => Promise<SaleUpdateResult>;
  addComment: (id: string, comment: string) => Promise<AddCommentResult>;
  users: Array<{
    id: string;
    authSub: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
  }>;
  usersLoading: boolean;
  usersError: string | null;
  loading: boolean;
};

export const useSaleDetailStore = (): MutationState => {
  const usersQuery = useListUsersForAssignmentQuery({ fetchPolicy: 'cache-and-network' });
  const [updateStatusMutation, updateStatusState] = useUpdateSaleStatusMutation();
  const [updateDelayMutation, updateDelayState] = useUpdateSaleDelayMutation();
  const [updateProblemMutation, updateProblemState] = useUpdateSaleProblemMutation();
  const [addTagMutation, addTagState] = useAddSaleTagMutation();
  const [removeTagMutation, removeTagState] = useRemoveSaleTagMutation();
  const [assignOwnerMutation, assignOwnerState] = useSetSaleFilledByMutation();
  const [addCommentMutation, addCommentState] = useAddSaleCommentMutation();

  const loading =
    updateStatusState.loading ||
    updateDelayState.loading ||
    updateProblemState.loading ||
    addTagState.loading ||
    removeTagState.loading ||
    assignOwnerState.loading ||
    addCommentState.loading;

  const updateStatus = async (id: string, status: SaleStatus) => {
    const response = await updateStatusMutation({
      variables: { id, status },
    });

    return {
      sale: response.data?.updateSaleStatus ?? null,
    };
  };

  const updateDelay = async (id: string, deliveryDelayAt: string | null) => {
    const response = await updateDelayMutation({
      variables: { id, deliveryDelayAt },
    });

    return {
      sale: response.data?.updateSaleDelay ?? null,
    };
  };

  const updateProblem = async (id: string, problemReason: string | null) => {
    const response = await updateProblemMutation({
      variables: { id, problemReason },
    });

    return {
      sale: response.data?.updateSaleProblem ?? null,
    };
  };

  const addTag = async (id: string, tagName: string) => {
    const response = await addTagMutation({
      variables: { id, tagName },
    });

    return { sale: response.data?.addSaleTag ?? null };
  };

  const removeTag = async (id: string, tagName: string) => {
    const response = await removeTagMutation({
      variables: { id, tagName },
    });

    return { sale: response.data?.removeSaleTag ?? null };
  };

  const assignOwner = async (id: string, userId: string) => {
    const response = await assignOwnerMutation({
      variables: { id, userId },
    });

    return { sale: response.data?.setSaleFilledBy ?? null };
  };

  const addComment = async (id: string, comment: string) => {
    const response = await addCommentMutation({
      variables: { id, comment },
    });

    return {
      comment: response.data?.addSaleComment ?? null,
    };
  };

  return {
    users: (usersQuery.data?.listUsersForAssignment ?? []).map(user => ({
      id: user.id,
      authSub: user.authSub ?? null,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      fullName: user.fullName,
    })),
    usersLoading: usersQuery.loading,
    usersError: usersQuery.error ? usersQuery.error.message : null,
    loading,
    updateStatus,
    updateDelay,
    updateProblem,
    addTag,
    removeTag,
    assignOwner,
    addComment,
  };
};
