# Implementation Plan: Sales Operations Dashboard

**Branch**: `[001-sales-operations-dashboard]` | **Date**: `2026-02-24` | **Spec**: `specs/001-sales-operations-dashboard/spec.md`
**Input**: Feature specification from `/specs/001-sales-operations-dashboard/spec.md`

## Summary

Build a single-page internal sales operations dashboard using a NestJS GraphQL backend (schema-first) and a React SPA frontend with Apollo Client. The system ingests ticket sale records from MongoDB into PostgreSQL every 3 minutes, preserves operational edits, and exposes status/delay/problem/tag/fill/comment workflows through GraphQL.

## Reference Boundary

`real-spec-template/` is the reference implementation copy and is now treated as read-only. Do not edit files under this path. All active implementation work must happen outside `real-spec-template/` while preserving this project's structure.

## Technical Context

**Language/Version**: TypeScript (Node.js + React 19)  
**Primary Dependencies**: `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `@nestjs/mongoose`, `@apollo/client`, `@tanstack/react-query`  
**Storage**: PostgreSQL for operational dashboard data + MongoDB as source-of-trust ingestion input  
**Testing**: `jest` (Nest unit/integration/contract), Playwright for UI acceptance, and contract regression checks for GraphQL operations  
**Target Platform**: Internal web dashboard, browser (desktop + mobile), backend in server container  
**Project Type**: Web application (frontend + backend services in a mono-repo style)  
**Performance Goals**: New sales visible in UI within 2 sync windows (<=6 minutes); list/detail interactions under normal UI latency expectations for internal operations workflows  
**Constraints**: Must preserve mutable operational fields on repeated sync; GraphQL is source-of-truth interface for UI; no Next.js usage on frontend  
**Scale/Scope**: Primary focus: internal team operations, thousands of sales/day with tags/comments/filtering at query scale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] No functional code is introduced until plan clarifications and core constraints are finalized.
- [ ] Data editing is restricted to permitted operational fields only.
- [ ] Background sync preserves user-owned operational edits.
- [ ] GraphQL schema remains contract-first and source-controlled.
- [ ] All generated contract types and generated frontend artifacts are tracked and regenerated as part of the flow.

> Note: `.specify/memory/constitution.md` is currently a template placeholder and does not currently include concrete governance clauses. This is not blocking planning execution, but the constitution should be completed before implementation to enforce governance gates.

## Phase 0: Research

### Research Outputs

- `research.md` resolves all implementation-relevant technical decisions:
  - API style is fixed to schema-first GraphQL for backend contract + typed frontend generation.
  - Ingestion strategy: cursor/state persisted, upsert by `external_sale_id`, never clobber operational fields.
  - Frontend routing: SPA with dedicated Sales / Delayed / Sale detail routes and shared stateful data providers.

### Dependencies & Best Practices Tasks

- Reuse schema-first GraphQL patterns and generated TS types from existing setup.
- Use repository pattern in NestJS data layer to isolate ingestion, query, and mutation paths.
- Use functional transformation utilities for immutable data mapping in both backend services and frontend selectors.

## Project Structure (this feature)

### Documentation (this feature)

```text
specs/001-sales-operations-dashboard/
├── plan.md                # This document
├── research.md            # Phase 0 outputs
├── data-model.md          # Entity model and validation rules
├── quickstart.md          # Setup + runbook
├── contracts/             # Interface contracts
│   └── graphql-api.md
└── tasks.md               # `/speckit.tasks` output
```

### Source Code (repository)

Reference snapshot (read-only):
```text
real-spec-template/
├── back/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sales/              # New feature: sale domain module
│   │   │   │   ├── sales.module.ts
│   │   │   │   ├── sales.resolver.ts
│   │   │   │   ├── sales.schema.ts
│   │   │   │   ├── sales.types.ts
│   │   │   │   ├── sales.repository.ts
│   │   │   │   ├── sales.service.ts
│   │   │   │   └── sales-ingestion.service.ts
│   │   ├── leader/             # Existing pattern retained
│   │   ├── worker/             # Existing pattern retained
│   │   ├── graphql.module.ts
│   │   └── core/                  # Existing core pattern retained
│   ├── app.env.ts                  # Add/extend env schema
│   ├── schema.graphql              # Add sales queries/mutations/types
│   ├── main-launch.ts
│   ├── worker-launch.ts
│   └── package.json
├── app/
│   └── (dashboard)/
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   ├── sales/
│       │   │   └── ui/
│       │   ├── graphql/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── services/
│       │   ├── store/
│       │   ├── types/
│       │   └── main.tsx
│       ├── vite.config.ts
│       ├── index.html
│       ├── package.json
│       └── codegen.yml
```

Implementation working copy (outside `real-spec-template/`):
```text
working-copy/
├── back/
└── app/
    └── (dashboard)
└── shared/
    └── sales-schema artifacts (if applicable)
```

### Structure Decision

- Keep module boundaries similar to RealSpec template (`modules/` + schema-first resolver registration).
- Keep a long-lived backend process for GraphQL (`leader`) and a worker-style ingestion service (`worker`) from the same source codebase.
- Frontend is implemented as a React SPA (non-Next) that reuses component/system style patterns from the template.

## Phase 1: Design & Contracts

## Data model and validation rules

`data-model.md` will include:

- **Sales** (immutable source fields, editable operational fields).
- **SaleStatus** enum: RECEIVED, COMPLETED, DELAYED, PROBLEM.
- **Tag**, **SaleTag**, **SaleComment**, **User**, **IngestionState**, **IngestionLog**.
- Upsert key: `external_sale_id` unique.
- Concurrency handling: `updated_at` as source and app-level updated timestamps; optional `row_version` for conflict checks.
- Read/Editable split:
  - Read-only: listing/event/ticket source fields.
  - Editable only: `status`, `delivery_delay_at`, `problem_reason`, `filled_by_user_id`, `tags`, `comments`.

## Source and Interface Contracts

`contracts/graphql-api.md` will define:
- `salesList(filter, sort, pagination)`
- `saleById(id)`
- `updateSaleStatus`, `updateSaleDelay`, `updateSaleProblem`, `setSaleFilledBy`, `addSaleTag`, `removeSaleTag`, `addSaleComment`
- Input/output shapes for `Sale`, `SaleListItem`, `SaleSortInput`, `SaleFilterInput`, `SalesPayload`.

## Quickstart strategy

`quickstart.md` will include explicit local bootstrap in this order:
1. Start Postgres and MongoDB.
2. Run backend migration + seed baseline users/initial enums.
3. Configure env vars (`MONGODB_URI`, `MONGO_INGESTION_POLL_MS=180000`, `POSTGRES_URL`/host+port+user+pass+database).
4. Start backend services in leader and worker modes.
5. Start React SPA and validate API + sales list/detail render.

## Phase 0 Research Details (implemented design decisions)

- **Sync**: Scheduled every 3 minutes with bounded cursor window and resilient retry + logging.
- **Mutations**: Expose mutation per editable field for explicitness and auditability in UI/API logs.
- **Pagination/Filtering**: Include both cursor and offset-compatible query args where practical, with stable default sort.

## Complexity Tracking

No non-essential architectural complexity is added at this stage. We stay with:

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|------------------------------------|
| Maintain separate worker/leader module in the same codebase | Enables clean operational alignment with existing RealSpec process model | A single-process with background jobs would reduce separation and make operational scaling harder |
| Keep GraphQL schema-first in `schema.graphql` | Preserves cross-service contract discipline and typed codegen | Resolver-first code would weaken shared contract checks |
| Keep tags as normalized join table | Enables filtering/search/analytics and avoids unstructured tags | `text[]` limits future queryability and analytics |
