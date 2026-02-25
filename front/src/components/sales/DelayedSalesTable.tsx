import { Link } from 'react-router-dom';

import { isPast, parseISO } from 'date-fns';

import { DelayedSalesBadge } from '@/components/sales/DelayedSalesBadge';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';
import type { Sale } from '@/generated/graphql';

type DelayedSalesTableProps = {
  sales: Sale[];
};

const formatDelay = (date: string | null | undefined): string => {
  if (!date) {
    return '—';
  }

  const parsed = parseISO(date);
  if (Number.isNaN(parsed.valueOf())) {
    return '—';
  }

  return parsed.toLocaleString();
};

const isOverdue = (date: string | null | undefined): boolean => {
  if (!date) {
    return false;
  }

  const parsed = parseISO(date);
  if (Number.isNaN(parsed.valueOf())) {
    return false;
  }

  return isPast(parsed);
};

const sortByUrgency = (sales: Sale[]): Sale[] => {
  return [...sales].sort((left, right) => {
    const leftOverdue = isOverdue(left.deliveryDelayAt);
    const rightOverdue = isOverdue(right.deliveryDelayAt);

    if (leftOverdue !== rightOverdue) {
      return leftOverdue ? -1 : 1;
    }

    const leftDelay = left.deliveryDelayAt ? Date.parse(left.deliveryDelayAt) : Number.POSITIVE_INFINITY;
    const rightDelay = right.deliveryDelayAt ? Date.parse(right.deliveryDelayAt) : Number.POSITIVE_INFINITY;

    if (leftDelay === rightDelay) {
      return left.externalSaleId.localeCompare(right.externalSaleId);
    }

    return leftDelay - rightDelay;
  });
};

export const DelayedSalesTable = ({ sales }: DelayedSalesTableProps) => {
  const sorted = sortByUrgency(sales);

  return (
    <div className="sales-table-shell">
      <table className="sales-table">
        <thead className="sales-table-head">
          <tr>
            <th className="sales-table-head-cell">Identifier</th>
            <th className="sales-table-head-cell">Status</th>
            <th className="sales-table-head-cell">Due</th>
            <th className="sales-table-head-cell">Urgency</th>
            <th className="sales-table-head-cell">Problem</th>
            <th className="sales-table-head-cell">Tags</th>
            <th className="sales-table-head-cell">Owner</th>
            <th className="sales-table-head-cell">Open</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={8} className="sales-table-cell">
                No delayed sales were returned for the current filters.
              </td>
            </tr>
          ) : (
            sorted.map(sale => (
              <tr
                key={sale.id}
                className={
                  isOverdue(sale.deliveryDelayAt)
                    ? 'sales-table-row sales-table-row-overdue'
                    : 'sales-table-row'
                }
              >
                <td className="sales-table-cell">{saleDisplayLabel(sale)}</td>
                <td className="sales-table-cell">{sale.status}</td>
                <td className="sales-table-cell">{formatDelay(sale.deliveryDelayAt)}</td>
                <td className="sales-table-cell">
                  <DelayedSalesBadge sale={sale} />
                </td>
                <td className="sales-table-cell">{sale.problemReason || '—'}</td>
                <td className="sales-table-cell">{sale.tags.map(tag => tag.name).join(', ') || '—'}</td>
                <td className="sales-table-cell">{sale.filledBy?.fullName || '—'}</td>
                <td className="sales-table-cell">
                  <Link className="text-sky-700 hover:text-sky-900" to={`/dashboard/sale/${sale.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
