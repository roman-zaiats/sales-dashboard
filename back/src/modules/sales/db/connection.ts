import { createSalesDatabaseContext, type SalesDatabaseContext } from './client';

let salesDatabaseContext: SalesDatabaseContext | null = null;

export const getSalesDatabaseContext = (): SalesDatabaseContext => {
  if (!salesDatabaseContext) {
    salesDatabaseContext = createSalesDatabaseContext();
  }

  return salesDatabaseContext;
};

export const closeSalesDatabaseContext = async (): Promise<void> => {
  if (!salesDatabaseContext) {
    return;
  }

  await salesDatabaseContext.pool.end();
  salesDatabaseContext = null;
};
