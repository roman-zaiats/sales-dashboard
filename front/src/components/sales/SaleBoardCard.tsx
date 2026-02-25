import { Link } from 'react-router-dom';
import { forwardRef, type HTMLAttributes } from 'react';

import type { Sale } from '@/generated/graphql';
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
        <strong className="text-sm text-slate-900">{sale.externalSaleId}</strong>
        <p className="mt-1 text-sm text-slate-700">{saleDisplayLabel(sale)}</p>
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
  },
);

SaleBoardCard.displayName = 'SaleBoardCard';
