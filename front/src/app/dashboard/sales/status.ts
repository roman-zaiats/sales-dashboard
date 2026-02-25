import { SALE_STATUS_LABELS, SALE_STATUS_VALUES } from '@/lib/sales/status';
import type { SaleStatus as GraphqlSaleStatus } from '@/generated/graphql';

export type SaleStatus = GraphqlSaleStatus;

export type BoardColumn = SaleStatus;

export const SALE_BOARD_COLUMNS: readonly BoardColumn[] = SALE_STATUS_VALUES;

export const SALE_BOARD_LABELS: Record<BoardColumn, string> = SALE_STATUS_LABELS;
