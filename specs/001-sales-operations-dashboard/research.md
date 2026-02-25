# Research Log: 001-sales-operations-dashboard

## Decisions

### 1) Architecture and Process Model

- Decision: Use separate backend roles in one NestJS codebase: GraphQL API mode and ingestion worker mode.
- Rationale: Aligns with RealSpec operational model and makes ingest/testing deployment predictable.
- Alternatives considered:
  - Single Nest process for both API and ingestion.
  - External scheduler service (e.g., cron pod).

### 2) Frontend Stack

- Decision: React SPA (no Next.js), Apollo Client, local data providers, shared component/layout structure.
- Rationale: User explicitly requested no Next.js and Apollo for GraphQL.
- Alternatives considered:
  - Next.js.
  - REST transport.

### 3) Sync Conflict Preservation

- Decision: Upsert by `external_sale_id` and preserve operational fields by explicit field map merge logic.
- Rationale: Prevents accidental overwrites and aligns business requirement.
- Alternatives considered:
  - Full record replacement (not safe for collaborative operations).
  - Source-of-truth override for all fields (violates requirement).

### 4) Pagination/Filtering

- Decision: backend supports filtering, search and sort + pagination in `salesList`.
- Rationale: Required by user flows and performance.
- Alternatives considered: unpaginated listing (unsafe at scale).

### 5) Edit Concurrency

- Decision: Last-write-wins with stale-edit warning at save-time when stale updates are detected.
- Rationale: Lightweight and operationally practical for internal workflows.
- Alternatives considered:
  - Pessimistic locks.
  - Silent overwrite.
