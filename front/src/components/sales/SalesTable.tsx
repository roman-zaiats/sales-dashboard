import { Link } from 'react-router-dom';

import type { Sale } from '@/generated/graphql';

type SalesTableProps = {
  sales: Sale[];
};

const toSaleLabel = (sale: Pick<Sale, 'externalSaleId' | 'listingId' | 'eventId'>): string => {
  if (sale.listingId) {
    return sale.listingId;
  }

  if (sale.eventId) {
    return sale.eventId;
  }

  return sale.externalSaleId;
};

const formatDelay = (date: string | null | undefined): string => {
  if (!date) {
    return '—';
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.valueOf())) {
    return '—';
  }

  return parsed.toLocaleString();
};

export const SalesTable = ({ sales }: SalesTableProps) => {
  return (
    <div className="sales-table-shell">
      <table className="sales-table">
        <thead className="sales-table-head">
          <tr>
            <th className="sales-table-head-cell">Identifier</th>
            <th className="sales-table-head-cell">Status</th>
            <th className="sales-table-head-cell">Created</th>
            <th className="sales-table-head-cell">Delay</th>
            <th className="sales-table-head-cell">Problem</th>
            <th className="sales-table-head-cell">Tags</th>
            <th className="sales-table-head-cell">Owner</th>
            <th className="sales-table-head-cell">Open</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sales.length === 0 ? (
            <tr>
              <td className="sales-table-cell" colSpan={8}>
                No sales were returned for the current filters.
              </td>
            </tr>
          ) : (
            sales.map(sale => (
              <tr key={sale.id} className="sales-table-row">
                <td className="sales-table-cell">{toSaleLabel(sale)}</td>
                <td className="sales-table-cell">{sale.status}</td>
                <td className="sales-table-cell">{new Date(sale.createdAt).toLocaleString()}</td>
                <td className="sales-table-cell">{formatDelay(sale.deliveryDelayAt)}</td>
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
