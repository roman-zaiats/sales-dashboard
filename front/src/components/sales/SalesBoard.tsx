import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';

import type { Sale } from '@/generated/graphql';

type SalesBoardProps = {
  sales: Sale[];
};

const STATUS_COLUMNS = ['RECEIVED', 'COMPLETED', 'DELAYED', 'PROBLEM'] as const;

type StatusColumn = (typeof STATUS_COLUMNS)[number];

const byStatus = (sales: Sale[], status: StatusColumn): Sale[] => {
  return sales.filter(sale => sale.status === status);
};

const formatDelay = (value: string | null | undefined): string => {
  if (!value) {
    return 'No Delay';
  }

  return new Date(value).toLocaleString();
};

const BoardCard = ({ sale }: { sale: Sale }): ReactNode => {
  return (
    <li className="sales-board-card">
      <strong className="text-sm text-slate-900">{sale.externalSaleId}</strong>
      <p className="mt-1 text-sm text-slate-700">{sale.listingId || sale.eventId || '-'}</p>
      <p className="mt-1 text-xs text-slate-500">Delay: {formatDelay(sale.deliveryDelayAt)}</p>
      <p className="mt-1 text-xs text-slate-500">Problem: {sale.problemReason || '—'}</p>
      <Link
        className="mt-3 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
        to={`/dashboard/sale/${sale.id}`}
      >
        Open
      </Link>
    </li>
  );
};

export const SalesBoard = ({ sales }: SalesBoardProps) => {
  return (
    <div className="sales-board-grid">
      {STATUS_COLUMNS.map(status => (
        <section key={status} className="sales-board-column">
          <h3 className="sales-board-title">{status}</h3>
          <ul className="mt-3 grid gap-2">
            {byStatus(sales, status).length === 0 ? <li key={`${status}-empty`} className="text-sm text-slate-500">No items</li> : byStatus(sales, status).map(sale => (
              <BoardCard sale={sale} key={sale.id} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
