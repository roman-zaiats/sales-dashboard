export enum SaleStatus {
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  PROBLEM = 'PROBLEM',
}

export type SortDirection = 'ASC' | 'DESC';

export type SaleSortField = 'created_at' | 'updated_at' | 'delivery_delay_at' | 'status';

export type SaleSortInput = {
  field: SaleSortField;
  direction: SortDirection;
};

export type SaleFilterInput = {
  status?: SaleStatus;
  tagIds?: string[];
  has_delay?: boolean;
  overdue_only?: boolean;
  search?: string;
};

export type PaginationInput = {
  skip?: number;
  limit?: number;
};

export type SalesSourcePayload = {
  raw?: Record<string, unknown>;
  sourceId?: string;
};

export type SaleOperationalPayload = {
  status: SaleStatus;
  deliveryDelayAt: string | null;
  problemReason: string | null;
  filledByUserId?: string | null;
};

export type SaleSourceRecord = {
  externalSaleId: string;
  listingId: string | null;
  eventId: string | null;
  quantity: number | null;
  price: number | null;
  currency: string | null;
  buyerEmail: string | null;
  sourceStatus: SaleStatus | null;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
  sourcePayload: SalesSourcePayload | null;
};

export type SaleOperationalMetadata = {
  createdAt: string;
  updatedAt: string;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
};

export type UserRecord = {
  id: string;
  authSub?: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type SaleTag = {
  id: string;
  name: string;
};

export type SaleComment = {
  id: string;
  author: string;
  comment: string;
  createdAt: string;
};

export type Sale = {
  id: string;
  externalSaleId: string;
  listingId?: string | null;
  eventId?: string | null;
  quantity?: number | null;
  price?: number | null;
  currency?: string | null;
  buyerEmail?: string | null;
  sourcePayload?: SalesSourcePayload | null;
  status: SaleStatus;
  deliveryDelayAt: string | null;
  problemReason: string | null;
  filledBy?: UserRecord | null;
  tags: SaleTag[];
  comments: SaleComment[];
  createdAt: string;
  updatedAt: string;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
};

export type SaleListPayload = {
  items: Sale[];
  totalCount: number;
};
