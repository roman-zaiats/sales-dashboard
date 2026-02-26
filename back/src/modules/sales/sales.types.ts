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

export type ListingFee = {
  type?: string | null;
  description?: string | null;
  amount?: string | number | null;
};

export type ListingSource = {
  sourceListingId?: string | null;
  listingId?: string | null;
  adviceIndex?: number | null;
  area?: string | null;
  assignedPos?: string | null;
  creationDate?: string | null;
  creationType?: string | null;
  eventId?: string | null;
  eventName?: string | null;
  exchange?: string | null;
  exchangesForSale?: string[];
  extraFee?: number | null;
  faceValue?: number | null;
  lastPosModificationDate?: string | null;
  lowerPrice?: number | null;
  offerId?: string | null;
  originalSection?: string | null;
  placesIds?: string[];
  price?: number | null;
  priceMultiplier?: number | null;
  pricingRuleMultiplierChangeTime?: string | null;
  quality?: number | null;
  quantity?: number | null;
  row?: string | null;
  rulePriceMultiplierIndex?: number | null;
  section?: string | null;
  splitRule?: string | null;
  startRow?: string | null;
  status?: string | null;
  statusChangeDate?: string | null;
  subPlatform?: string | null;
  tags?: string[];
  ticketTypeName?: string | null;
  venueName?: string | null;
  fees?: ListingFee[];
};

export type Listing = {
  id: string;
  sourceListingId: string;
  listingId?: string | null;
  adviceIndex: number | null;
  area: string | null;
  assignedPos: string | null;
  creationDate: string | null;
  creationType: string | null;
  eventId: string | null;
  eventName: string | null;
  exchange: string | null;
  exchangesForSale: string[];
  extraFee: number | null;
  faceValue: number | null;
  lastPosModificationDate: string | null;
  lowerPrice: number | null;
  offerId: string | null;
  originalSection: string | null;
  placesIds: string[];
  price: number | null;
  priceMultiplier: number | null;
  pricingRuleMultiplierChangeTime: string | null;
  quality: number | null;
  quantity: number | null;
  row: string | null;
  rulePriceMultiplierIndex: number | null;
  section: string | null;
  splitRule: string | null;
  startRow: string | null;
  status: string | null;
  statusChangeDate: string | null;
  subPlatform: string | null;
  ticketTypeName: string | null;
  venueName: string | null;
  fees: ListingFee[] | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SaleSourceRecord = {
  externalSaleId: string;
  buyerEmail: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  sourceStatus: SaleStatus | null;
  listing: ListingSource;
};

export type SaleOperationalPayload = {
  status: SaleStatus;
  deliveryDelayAt: string | null;
  problemReason: string | null;
  filledByUserId?: string | null;
};

export type SaleConcurrencyInput = {
  expectedUpdatedAt?: string | null;
};

export type SaleOperationalMetadata = {
  createdAt: string;
  updatedAt: string;
};

export type UserRecord = {
  id: string;
  authSub?: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type DashboardTag = {
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
  listing: Listing | null;
  buyerEmail?: string | null;
  status: SaleStatus;
  deliveryDelayAt: string | null;
  problemReason: string | null;
  filledBy?: UserRecord | null;
  dashboardTags: DashboardTag[];
  comments: SaleComment[];
  createdAt: string;
  updatedAt: string;
  expectedUpdatedAt?: string | null;
};

export type SaleListPayload = {
  items: Sale[];
  totalCount: number;
};
