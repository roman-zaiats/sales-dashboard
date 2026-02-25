import { SALE_STALE_EDIT_WARNING } from '@/store/sales/sale-detail.mutations';
import type { Sale, SaleStatus } from '@/generated/graphql';
import { useSalesQueries } from '@/store/sales/sales.queries';
import { useUpdateSaleStatusMutation } from '@/generated/graphql';

export type BoardMoveResult = {
  sale: Sale;
};

export type SalesBoardMovePayload = {
  id: string;
  status: SaleStatus;
  expectedUpdatedAt: string;
};

export const useSalesBoardStore = () => {
  const [updateSaleStatusMutation, updateSaleStatusState] = useUpdateSaleStatusMutation();
  const { refreshSalesQueries } = useSalesQueries();

  const moveSaleStatus = async ({ id, status, expectedUpdatedAt }: SalesBoardMovePayload): Promise<BoardMoveResult> => {
    const response = await updateSaleStatusMutation({
      variables: {
        id,
        status,
        expectedUpdatedAt,
      },
    });

    const updatedSale = response.data?.updateSaleStatus;

    if (!updatedSale) {
      throw new Error(SALE_STALE_EDIT_WARNING);
    }

    try {
      await refreshSalesQueries();
    } catch {
      // Non-fatal: sale update succeeded, but query cache invalidation is best-effort.
    }

    return {
      sale: updatedSale,
    };
  };

  return {
    moveSaleStatus,
    loading: updateSaleStatusState.loading,
  };
};
