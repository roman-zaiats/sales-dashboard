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
    const combinedClassName = `shadcn-card p-0 ${className}`.trim();

    return (
      <li ref={ref} className={combinedClassName} {...liProps}>
        <Card className="shadcn-card">
            <CardHeader className="shadcn-card-header">
            <CardTitle className="shadcn-card-title">{sale.externalSaleId}</CardTitle>
            <CardDescription className="shadcn-card-description">{saleDisplayLabel(sale)}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Delay: {formatDelay(sale.deliveryDelayAt)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Problem: {sale.problemReason || '—'}</p>
          </CardContent>
          <CardFooter className="shadcn-card-footer">
            <Link className="text-sm font-medium text-primary hover:text-foreground" to={`/dashboard/sale/${sale.id}`}>
              Open
            </Link>
          </CardFooter>
        </Card>
      </li>
    );
  },
);

SaleBoardCard.displayName = 'SaleBoardCard';
