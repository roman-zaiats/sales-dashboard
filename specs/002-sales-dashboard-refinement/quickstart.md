# Quickstart: Sales Operations Dashboard Refinement

## Scope

This document describes setup and verification for development of `002-sales-dashboard-refinement`.

## Prerequisites

- Node.js (matching workspace expectation for npm tooling)
- PostgreSQL connection available
- MongoDB source database (ingestion input)
- Existing `.env` values for backend and frontend

## Environment

Backend required values include the operational database credentials used by Nest and the source connection used by ingestion logic.

## One-time setup

1. Install dependencies at repo root package boundaries:
   - `cd back && npm install`
   - `cd front && npm install`
2. Review backend schema and env loading before first run:
   - `back/app.env.ts`
   - `front/src/graphql` codegen config

## Build and verification flow (per Constitution phase gate)

1. Backend build:
   - `cd back && npm run build`
2. Backend tests:
   - `cd back && npm run test`
3. Frontend typecheck:
   - `cd front && npm run typecheck`
4. Frontend build:
   - `cd front && npm run build`

Shortcut:

- `scripts/phase-gate.sh`

## Development mode

1. Start backend in unified app mode:
   - `cd back && npm run start`
2. Start frontend:
   - `cd front && npm run dev`
3. Open dashboard and validate:
   - Sales, board, delayed, and detail routes are reachable.
4. Validate board behavior:
   - Drag card across status columns.
   - Confirm update reflected in table/detail views quickly.

## Contract tooling

1. Keep schema as contract source:
   - Modify `back/schema.graphql` for API changes.
2. Regenerate frontend types after schema edits:
   - `cd front && npm run codegen:graphql`

## Common phase check cadence

- Run the phase gate after each planned milestone:
  - build
  - test
  - typecheck/build
