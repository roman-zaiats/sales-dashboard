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

export type UserRecord = {
  id: string;
  authSub?: string;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type Listing = {
  id: string;
  sourceListingId: string;
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
  placesIds: string[];
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
  tags: string[];
  ticketTypeName?: string | null;
  venueName?: string | null;
  fees?: Array<{
    type?: string | null;
    description?: string | null;
    amount?: string | number | null;
  }> | null;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  buyerEmail?: string | null;
  listing?: Listing | null;
  status: SaleStatus;
  deliveryDelayAt?: string | null;
  problemReason?: string | null;
  filledBy?: UserRecord | null;
  dashboardTags: DashboardTag[];
  comments: SaleComment[];
  createdAt: string;
  updatedAt: string;
};

export type SaleListPayload = {
  items: Sale[];
  totalCount: number;
};
