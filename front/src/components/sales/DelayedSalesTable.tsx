import { Link } from 'react-router-dom';

import { isPast, parseISO } from 'date-fns';

import { DelayedSalesBadge } from '@/components/sales/DelayedSalesBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identifier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due</TableHead>
          <TableHead>Urgency</TableHead>
          <TableHead>Problem</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell className="text-muted-foreground" colSpan={8}>
                No delayed sales were returned for the current filters.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map(sale => (
              <TableRow
                key={sale.id}
                className={
                  isOverdue(sale.deliveryDelayAt)
                    ? 'sales-table-row sales-table-row-overdue'
                    : 'sales-table-row'
                }
              >
                <TableCell>{saleDisplayLabel(sale)}</TableCell>
                <TableCell>{sale.status}</TableCell>
                <TableCell>{formatDelay(sale.deliveryDelayAt)}</TableCell>
                <TableCell>
                  <DelayedSalesBadge sale={sale} />
                </TableCell>
                <TableCell>{sale.problemReason || '—'}</TableCell>
                <TableCell>{sale.dashboardTags.map(tag => tag.name).join(', ') || '—'}</TableCell>
                <TableCell>{sale.filledBy?.fullName || '—'}</TableCell>
                <TableCell>
                  <Link className="text-primary hover:text-foreground" to={`/dashboard/sale/${sale.id}`}>
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
      </TableBody>
    </Table>
  );
};
