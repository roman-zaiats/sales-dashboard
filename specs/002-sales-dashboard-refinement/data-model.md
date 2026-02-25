# Data Model: Sales Operations Dashboard Refinement

## Domain Entities

### Sale

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Primary key; internal stable identifier |
| externalSaleId | String | Ingestion + dashboard | Required, unique source identifier |
| listingId | String | Ingestion | Optional |
| eventId | String | Ingestion | Optional |
| quantity | Int | Ingestion | Non-negative integer |
| price | Float | Ingestion | Optional currency amount |
| currency | String | Ingestion | Optional |
| buyerEmail | String | Ingestion | Optional; operational edits should not change |
| sourcePayload | JSON | Ingestion | Optional raw payload, read-only |
| status | SaleStatus | Both | Required; constrained to enum (`RECEIVED`, `COMPLETED`, `DELAYED`, `PROBLEM`) |
| deliveryDelayAt | DateTime | Dashboard | Nullable; updates from delay form/mutation |
| problemReason | String | Dashboard | Nullable |
| filledBy | User | Dashboard | Nullable assignment reference |
| tags | [SaleTag] | Dashboard + Ingestion | Mergeable in list/filter operations |
| comments | [SaleComment] | Dashboard | Append-only log of notes/comments |
| createdAt | DateTime | Dashboard | Read-only |
| updatedAt | DateTime | Dashboard | Required for stale-move detection and optimistic concurrency |

### User

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Internal identity |
| authSub | String | Auth provider / assignment data | Optional |
| firstName | String | Optional |
| lastName | String | Optional |
| fullName | String | Computed / read-only |

### SaleTag

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Primary key |
| name | String | Dashboard | Required, unique (case-insensitive recommendation) |

### SaleComment

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Primary key |
| saleId | ID | Dashboard | Foreign key to `Sale` |
| author | String | Dashboard | Required |
| comment | String | Dashboard | Required, non-empty |
| createdAt | DateTime | Dashboard | Read-only |

### IngestionRun

| Field | Type | Source | Constraints / Notes |
|---|---|---|---|
| id | ID | Dashboard | Internal batch tracking |
| startedAt | DateTime | System | Read-only |
| finishedAt | DateTime | System | Optional |
| status | String | System | `running`, `success`, `failed` (or similar) |
| startedAtCursor | DateTime | Ingestion | Optional |
| summary | JSON | System | Optional operational summary |

## Relationships

- `Sale` 1..* `SaleComment`
- `Sale` *..* `SaleTag` (normalized relation via join table)
- `Sale` 0..1 `User` via `filledBy`
- `IngestionRun` writes and updates `Sale` records without clobbering allowed operational fields when conflict conditions require preservation

## State Model

- `Sale.status` supports all transitions among the four values.
- Drag-and-drop must map:
  - card move between board columns -> target status
  - status change persisted through GraphQL mutation
- `Sale` may carry operational changes while ingestion is running.

## Validation Rules

- OR-tag matching:
  - selected/typed tags should match when at least one selected tag exists on a sale.
- Duplicate tag names:
  - normalize display (trim, collapse adjacent spaces) and dedupe before submission.
- Stale move guard:
  - mutation must include prior `updatedAt` (`expected_updated_at`).
  - mismatch -> reject mutation and surface refresh warning.
- Drag move failure handling:
  - revert card on failure.
  - keep user intent visible and actionable (retry or manual refresh cue).
- ORM migration:
  - Drizzle-backed entities for persisted domain writes and reads.
- Left shell and navigation:
  - all interactive surface components in key screens should use ShadCN component patterns from local UI primitives.
