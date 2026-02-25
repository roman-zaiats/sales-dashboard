import { useApolloClient } from '@apollo/client';

const SALES_QUERY_OPERATION_NAMES = ['SalesList', 'DelayedSales', 'SaleById'];

export const useSalesQueries = () => {
  const client = useApolloClient();

  const refreshSalesQueries = async (): Promise<void> => {
    await client.refetchQueries({
      include: SALES_QUERY_OPERATION_NAMES,
    });
  };

  return {
    refreshSalesQueries,
    operationNames: SALES_QUERY_OPERATION_NAMES,
  };
};
