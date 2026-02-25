import { forwardRef, type HTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

import type { Sale } from '@/generated/graphql';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saleDisplayLabel } from '@/lib/sales/sales-utils';

type SaleBoardCardProps = {
  sale: Sale;
} & HTMLAttributes<HTMLLIElement>;

const formatDelay = (value: string | null | undefined): string => {
  if (!value) {
    return 'No Delay';
  }

  return new Date(value).toLocaleString();
};

export const SaleBoardCard = forwardRef<HTMLLIElement, SaleBoardCardProps>(
  ({ sale, className = '', ...liProps }, ref) => {
    const combinedClassName = `sales-board-card ${className}`.trim();

    return (
      <li ref={ref} className={combinedClassName} {...liProps}>
        <Card>
          <CardHeader>
            <CardTitle>{sale.externalSaleId}</CardTitle>
            <CardDescription>{saleDisplayLabel(sale)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mt-1 text-xs text-slate-500">Delay: {formatDelay(sale.deliveryDelayAt)}</p>
            <p className="mt-1 text-xs text-slate-500">Problem: {sale.problemReason || '—'}</p>
          </CardContent>
          <CardFooter>
            <Link
              className="inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
              to={`/dashboard/sale/${sale.id}`}
            >
              Open
            </Link>
          </CardFooter>
        </Card>
      </li>
    );
  },
);

SaleBoardCard.displayName = 'SaleBoardCard';
