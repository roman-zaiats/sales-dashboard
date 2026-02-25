export type SaleStatus = 'RECEIVED' | 'COMPLETED' | 'DELAYED' | 'PROBLEM';

export type SortDirection = 'ASC' | 'DESC';

export type SaleSortField = 'createdAt' | 'updatedAt' | 'deliveryDelayAt' | 'status';

export type SaleSortInput = {
  field: SaleSortField;
  direction: SortDirection;
};

export type SaleFilterInput = {
  status?: SaleStatus;
  tagIds?: string[];
  hasDelay?: boolean;
  overdueOnly?: boolean;
  search?: string;
};

export type PaginationInput = {
  skip: number;
  limit: number;
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

export type UserRecord = {
  id: string;
  authSub?: string;
  firstName: string;
  lastName: string;
  fullName: string;
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
  status: SaleStatus;
  deliveryDelayAt?: string | null;
  problemReason?: string | null;
  filledBy?: UserRecord | null;
  tags: SaleTag[];
  comments: SaleComment[];
  createdAt: string;
  updatedAt: string;
};

export type SaleListPayload = {
  items: Sale[];
  totalCount: number;
};
