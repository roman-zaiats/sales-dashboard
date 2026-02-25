import { type ReactNode } from 'react';

import type { Sale } from '@/generated/graphql';
import { SALE_BOARD_LABELS } from '@/app/dashboard/sales/status';
import { SaleBoardCard } from '@/components/sales/SaleBoardCard';

type SalesBoardProps = {
  sales: Sale[];
};

type StatusColumn = 'RECEIVED' | 'COMPLETED' | 'DELAYED' | 'PROBLEM';

const STATUS_COLUMNS: StatusColumn[] = ['RECEIVED', 'COMPLETED', 'DELAYED', 'PROBLEM'];

const byStatus = (sales: Sale[], status: StatusColumn): Sale[] => {
  return sales.filter(sale => sale.status === status);
};

const BoardCard = ({ sale }: { sale: Sale }): ReactNode => <SaleBoardCard sale={sale} />;

export const SalesBoard = ({ sales }: SalesBoardProps) => {
  return (
    <div className="sales-board-grid">
      {STATUS_COLUMNS.map(status => (
        <section key={status} className="sales-board-column">
          <h3 className="sales-board-title">{SALE_BOARD_LABELS[status] || status}</h3>
          <ul className="mt-3 grid gap-2">
            {byStatus(sales, status).length === 0 ? (
              <li key={`${status}-empty`} className="text-sm text-slate-500">
                No items
              </li>
            ) : (
              byStatus(sales, status).map(sale => <BoardCard sale={sale} key={sale.id} />)
            )}
          </ul>
        </section>
      ))}
    </div>
  );
};
