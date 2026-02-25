import { isPast, parseISO } from 'date-fns';

import type { Sale } from '@/store/sales/types';

export const isSaleDelayed = (sale: Pick<Sale, 'deliveryDelayAt'>): boolean =>
  Boolean(sale.deliveryDelayAt && isPast(parseISO(sale.deliveryDelayAt)));

export const saleDisplayLabel = (sale: Pick<Sale, 'externalSaleId' | 'listingId' | 'eventId'>): string => {
  if (sale.listingId) {
    return sale.listingId;
  }

  if (sale.eventId) {
    return sale.eventId;
  }

  return sale.externalSaleId;
};

export const saleChipText = (sale: Pick<Sale, 'status' | 'deliveryDelayAt'>): string => {
  if (!sale.deliveryDelayAt) {
    return sale.status;
  }

  if (isSaleDelayed(sale)) {
    return `${sale.status} (Overdue)`;
  }

  return `${sale.status} (Tracked)`;
};
