# Quickstart: Remove Sale Source Fields

## Scope

This document covers implementation sequencing for `003-remove-sale-source-fields`.

## Prerequisites

- Node.js workspace configured for both `back` and `front` package scripts.
- PostgreSQL and MongoDB are available for local execution.
- You are on branch `003-remove-sale-source-fields`.
- Backend contract changes completed before any front-end cleanup changes begin.

## Environment

Backend env: `back/app.env.ts` and runtime environment must support Postgres and Mongo ingestion credentials.

Frontend env: `VITE_GRAPHQL_ENDPOINT` points at the local GraphQL endpoint after backend updates.

## Backend phase (required first)

1. Install dependencies in both workspaces.
2. Back up the existing sales tables or verify staging restore strategy.
3. Apply schema migration for sales/listings field removal.
4. Update repository types and query mapping to match removed columns.
5. Update GraphQL schema in `back/schema.graphql` and align all resolver return shapes.
6. Regenerate contract artifacts for downstream consumers:
   - `cd front && npm run codegen:graphql`
7. Validate backend behavior for list/detail/mutation flows with removed fields.
8. Run phase gate:
   - `cd back && npm run build`
   - `cd back && npm run test`
   - `cd front && npm run typecheck`
   - `cd front && npm run build`

## Frontend phase (only after backend phase + latest pull)

1. Pull latest frontend changes first.
2. Update GraphQL documents in `front/src/graphql` to match new backend shape.
3. Remove all component and utility references to `externalSaleId` and `sourcePayload`.
4. Remove generated/frontend type references in store/selectors/usages and re-run codegen.
5. Run frontend verification:
   - `cd front && npm run typecheck`
   - `cd front && npm run build`

## Ongoing verification

- Reconcile migration behavior by confirming no API payloads include removed fields.
- Confirm list/detail flows still expose required operational data (`status`, `deliveryDelayAt`, `problemReason`, `dashboardTags`, comments, owner, timestamps).
