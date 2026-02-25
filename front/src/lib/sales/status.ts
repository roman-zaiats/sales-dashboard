import type { SaleStatus as GraphqlSaleStatus } from '@/generated/graphql';

export type SaleStatus = GraphqlSaleStatus;

export const SALE_STATUS_VALUES: readonly SaleStatus[] = [
  'RECEIVED',
  'COMPLETED',
  'DELAYED',
  'PROBLEM',
];

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  RECEIVED: 'Received',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
  PROBLEM: 'Problem',
};

export const SALE_STATUS_TRANSITIONS: Record<SaleStatus, readonly SaleStatus[]> = {
  RECEIVED: ['COMPLETED', 'DELAYED', 'PROBLEM'],
  COMPLETED: ['RECEIVED', 'DELAYED', 'PROBLEM'],
  DELAYED: ['RECEIVED', 'COMPLETED', 'PROBLEM'],
  PROBLEM: ['RECEIVED', 'COMPLETED', 'DELAYED'],
};

export const isValidSaleStatus = (value: string): value is SaleStatus =>
  (SALE_STATUS_VALUES as readonly string[]).includes(value);

export const isValidStatusTransition = (from: SaleStatus, to: SaleStatus): boolean =>
  SALE_STATUS_TRANSITIONS[from].includes(to);
