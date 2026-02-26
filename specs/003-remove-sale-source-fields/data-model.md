# Data Model: Remove Sale Source Fields

## Domain Entities

### Sale

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | UUID | Dashboard | Primary key; internal stable identifier |
| buyerEmail | String | Ingestion | Optional |
| status | SaleStatus | Dashboard | Required; constrained to enum (`RECEIVED`, `COMPLETED`, `DELAYED`, `PROBLEM`) |
| deliveryDelayAt | DateTime | Dashboard | Optional |
| problemReason | String | Dashboard | Optional |
| filledBy | User | Dashboard | Optional assignment reference |
| listing | Listing | Ingestion + dashboard | Relationship required for existing detail and list rendering |
| dashboardTags | [DashboardTag] | Dashboard | Optional many-to-many |
| comments | [SaleComment] | Dashboard | Append-only notes |
| createdAt | DateTime | Dashboard | Read-only |
| updatedAt | DateTime | Dashboard | Required for sequencing and write conflict handling |
| expectedUpdatedAt | DateTime | Dashboard | Optional concurrency support used by mutations |

### Listing

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | UUID | Dashboard | Primary key |
| sourceListingId | String | Ingestion | Required and unique source listing key |
| listingId | String | Ingestion | Optional |
| adviceIndex | Int | Ingestion | Optional |
| area | String | Ingestion | Optional |
| assignedPos | String | Ingestion | Optional |
| creationDate | DateTime | Ingestion | Optional |
| creationType | String | Ingestion | Optional |
| eventId | String | Ingestion | Optional |
| eventName | String | Ingestion | Optional |
| exchange | String | Ingestion | Optional |
| exchangesForSale | [String] | Ingestion | Optional |
| extraFee | Float | Ingestion | Optional |
| faceValue | Float | Ingestion | Optional |
| lastPosModificationDate | DateTime | Ingestion | Optional |
| lowerPrice | Float | Ingestion | Optional |
| offerId | String | Ingestion | Optional |
| originalSection | String | Ingestion | Optional |
| placesIds | [String] | Ingestion | Optional |
| price | Float | Ingestion | Optional |
| priceMultiplier | Float | Ingestion | Optional |
| pricingRuleMultiplierChangeTime | DateTime | Ingestion | Optional |
| quality | Float | Ingestion | Optional |
| quantity | Int | Ingestion | Optional |
| row | String | Ingestion | Optional |
| rulePriceMultiplierIndex | Int | Ingestion | Optional |
| section | String | Ingestion | Optional |
| splitRule | String | Ingestion | Optional |
| startRow | String | Ingestion | Optional |
| status | String | Ingestion | Optional |
| statusChangeDate | DateTime | Ingestion | Optional |
| subPlatform | String | Ingestion | Optional |
| tags | [String] | Ingestion | Optional |
| ticketTypeName | String | Ingestion | Optional |
| venueName | String | Ingestion | Optional |
| fees | [ListingFee] | Ingestion | Optional |
| createdAt | DateTime | Dashboard | Read-only |
| updatedAt | DateTime | Dashboard | Read-only |

### DashboardTag

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Primary key |
| name | String | Dashboard | Required, unique |

### SaleComment

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Primary key |
| author | String | Dashboard | Required |
| comment | String | Dashboard | Required, non-empty |
| createdAt | DateTime | Dashboard | Read-only |

### User

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Internal identity |
| authSub | String | Identity source | Optional |
| firstName | String | Identity source | Optional |
| lastName | String | Identity source | Optional |
| fullName | String | Computed | Always exposed in contract |

## Relationships

- `Sale` 1..1 `Listing`
- `Sale` 0..* `DashboardTag` through `sale_tags`
- `Sale` 1..* `SaleComment`
- `Sale` 0..1 `User` through `filledByUserId`

## Validation Rules

- `Sale.status` must always be one of `SaleStatus` enum values.
- `updatedAt` must be updated on each operational mutation.
- `expectedUpdatedAt` must be used for optimistic mutation protection where applicable.
- `sourcePayload` is no longer part of Sale or Listing entities.
- `externalSaleId` is not persisted or exposed by the Sale entity.

## Exclusion Rules

- Source payload tracing and legacy external sale identifier fields are excluded from active sales/listing API models.
- No UI references to excluded fields are required in the front-end phase.
