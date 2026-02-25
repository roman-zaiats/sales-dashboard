import { Link } from 'react-router-dom';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';
import type { Sale } from '@/generated/graphql';

type SalesTableProps = {
  sales: Sale[];
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Identifier</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Delay</TableHead>
          <TableHead>Problem</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Open</TableHead>
        </TableRow>
      </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground">
                No sales were returned for the current filters.
              </TableCell>
            </TableRow>
          ) : (
            sales.map(sale => (
              <TableRow key={sale.id} className="sales-table-row">
                <TableCell>{saleDisplayLabel(sale)}</TableCell>
                <TableCell>{sale.status}</TableCell>
                <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                <TableCell>{formatDelay(sale.deliveryDelayAt)}</TableCell>
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
