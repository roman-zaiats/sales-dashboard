# Quickstart: Sales Operations Dashboard

## Reference vs Implementation

- `real-spec-template/` is the reference template and must not be modified.
- Implementation work should be done in this repository outside `real-spec-template/` (same structure as the reference).

## Backend (NestJS / GraphQL / Postgres / MongoDB)

1. From your implementation backend folder (same structure as `real-spec-template/back`), install dependencies.
2. Configure required env variables:
   - `MONGODB_URI` (or `SECRET_MONGODB_URI`)
   - `MONGO_INGESTION_POLL_MS=180000`
   - `POSTGRES_URL` (or split host/port/user/password/database)
   - `SYNC_SOURCE_CURSOR_KEY` (optional override)
   - `GRAPHQL_PATH`, `GRAPHQL_PLAYGROUND`, `GRAPHQL_INTROSPECTION`
   - `API_PREFIX`
   - No auth middleware is required for local smoke checks.
3. Start schema and DB migrations for `sales`, `tags`, `sale_tags`, `sale_comments`, `users`, `ingestion_state`, `ingestion_logs`.
4. Start leader: `APP_MODE=leader npm run start:leader:dev`.
5. Start worker: `APP_MODE=worker npm run start:worker:dev`.
6. Validate GraphQL endpoint and introspection without auth:
   - `curl -s -X POST http://localhost:8000/api/v1/graphql -H "content-type: application/json" --data '{ "query":"query { salesList { totalCount } }" }'`
   - `curl -s -X POST http://localhost:8000/api/v1/graphql -H "content-type: application/json" --data '{ "query":"query { delayedSales(pagination:{limit:1}) { totalCount items { id externalSaleId status updatedAt } } }" }'`

## Frontend (React SPA)

1. From your implementation SPA folder (same structure as `real-spec-template/front` / `app/(dashboard)`), install dependencies.
2. Set env vars for API:
   - `VITE_GRAPHQL_ENDPOINT`
   - Frontend runs unauthenticated for local smoke checks.
3. Generate GraphQL types and hooks: `npm run codegen:graphql`.
4. Start SPA: `npm run dev`.
5. Build all UI using Tailwind utility classes (`className` with Tailwind tokens).
   - The dashboard styling layer intentionally uses `className` utilities and shared components in `front/src/app/styles.css`.
6. Open the SPA and verify:
   - Sales list loads.
   - Delay/problem/tag/assigned edits persist.
   - Delayed page renders overdue indicators.

## Local validation

- Seed one sale and run two manual edits while running one sync cycle:
  - Confirm `source` fields refresh.
  - Confirm operational fields persist.
- Run list/detail smoke tests for loading/error/empty states.
