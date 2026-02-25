import { isPast, parseISO } from 'date-fns';

import type { Sale } from '@/store/sales/types';

export const isSaleDelayed = (sale: Pick<Sale, 'deliveryDelayAt'>): boolean =>
  Boolean(sale.deliveryDelayAt && isPast(parseISO(sale.deliveryDelayAt)));

export const saleDisplayLabel = (sale: Pick<Sale, 'externalSaleId' | 'listing'>): string => {
  if (sale.listing?.listingId) {
    return sale.listing.listingId;
  }

  if (sale.listing?.eventId) {
    return sale.listing.eventId;
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
