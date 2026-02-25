import { isPast, parseISO } from 'date-fns';

import type { Sale } from '@/generated/graphql';

type DelayedSalesBadgeProps = {
  sale: Pick<Sale, 'deliveryDelayAt'>;
};

const formatRemainingWindow = (deliveryDate: string | null) => {
  if (!deliveryDate) {
    return '—';
  }

  const parsed = parseISO(deliveryDate);
  if (Number.isNaN(parsed.valueOf())) {
    return 'Invalid date';
  }

  const diffMinutes = Math.abs(Math.trunc((parsed.valueOf() - Date.now()) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const hours = Math.trunc(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};

export const DelayedSalesBadge = ({ sale }: DelayedSalesBadgeProps) => {
  if (!sale.deliveryDelayAt) {
    return <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">No delay</span>;
  }

  const parsed = parseISO(sale.deliveryDelayAt);
  if (Number.isNaN(parsed.valueOf())) {
    return <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">Invalid date</span>;
  }

  const overdue = isPast(parsed);
  const isNear = parsed.getTime() - Date.now() > 0 && parsed.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const remaining = formatRemainingWindow(sale.deliveryDelayAt);

  if (overdue) {
    return (
      <span className="rounded-full border border-rose-300 bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">
        Overdue · {remaining}
      </span>
    );
  }

  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-semibold ${
        isNear ? 'border-amber-300 bg-amber-100 text-amber-800' : 'border-emerald-300 bg-emerald-100 text-emerald-800'
      }`}
    >
      Due in {remaining}
    </span>
  );
};
