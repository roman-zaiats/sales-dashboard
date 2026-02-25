import {
  type Sale,
  type SaleStatus,
  useUpdateSaleDelayMutation,
  useUpdateSaleProblemMutation,
  useUpdateSaleStatusMutation,
} from '@/generated/graphql';

export const SALE_STALE_EDIT_WARNING =
  'This sale was updated while editing. Reload and reapply your changes to avoid overwriting newer updates.';

type MutationReturn = {
  sale: Sale | null;
};

type UseSaleDetailMutations = {
  updateStatus: (
    id: string,
    status: SaleStatus,
    expectedUpdatedAt?: string | null,
  ) => Promise<MutationReturn>;
  updateDelay: (
    id: string,
    deliveryDelayAt: string | null,
    expectedUpdatedAt?: string | null,
  ) => Promise<MutationReturn>;
  updateProblem: (
    id: string,
    problemReason: string | null,
    expectedUpdatedAt?: string | null,
  ) => Promise<MutationReturn>;
  loading: boolean;
};

const isNonNullable = <T,>(value: T): value is NonNullable<T> => value !== null && value !== undefined;

export const detectSaleUpdateStaleness = (
  saleUpdatedAt: string | null | undefined,
  baselineUpdatedAt: string | null | undefined,
): boolean => {
  return isNonNullable(baselineUpdatedAt) && saleUpdatedAt !== baselineUpdatedAt;
};

export const useSaleDetailMutations = (): UseSaleDetailMutations => {
  const [updateStatusMutation, updateStatusState] = useUpdateSaleStatusMutation();
  const [updateDelayMutation, updateDelayState] = useUpdateSaleDelayMutation();
  const [updateProblemMutation, updateProblemState] = useUpdateSaleProblemMutation();

  const loading = updateStatusState.loading || updateDelayState.loading || updateProblemState.loading;

  const updateStatus = async (
    id: string,
    status: SaleStatus,
    expectedUpdatedAt?: string | null,
  ) => {
    const response = await updateStatusMutation({
      variables: {
        id,
        status,
        expectedUpdatedAt,
      },
    });

    return { sale: response.data?.updateSaleStatus ?? null };
  };

  const updateDelay = async (
    id: string,
    deliveryDelayAt: string | null,
    expectedUpdatedAt?: string | null,
  ) => {
    const response = await updateDelayMutation({
      variables: {
        id,
        deliveryDelayAt,
        expectedUpdatedAt,
      },
    });

    return { sale: response.data?.updateSaleDelay ?? null };
  };

  const updateProblem = async (
    id: string,
    problemReason: string | null,
    expectedUpdatedAt?: string | null,
  ) => {
    const response = await updateProblemMutation({
      variables: {
        id,
        problemReason,
        expectedUpdatedAt,
      },
    });

    return { sale: response.data?.updateSaleProblem ?? null };
  };

  return {
    updateStatus,
    updateDelay,
    updateProblem,
    loading,
  };
};
