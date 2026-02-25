# Tasks: Sales Operations Dashboard

`real-spec-template/` is a reference-only copy. Do not edit files under this directory. Use equivalent working-copy paths outside `real-spec-template/` for implementation.

**Input**: Design documents from `/specs/001-sales-operations-dashboard/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/graphql-api.md, research.md
**Context**: Authentication is intentionally deferred for this cycle (no auth implementation tasks).

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Add sales-related environment keys to `real-spec-template/back/.env.example` (`SALES_DATABASE_URL`, `SALES_DATABASE_SSL`, `MONGO_INGESTION_POLL_MS`, `MONGO_INGESTION_DATABASE`, `MONGO_INGESTION_COLLECTION`, `MONGO_INGESTION_BATCH_SIZE`).
- [X] T002 Add `VITE_GRAPHQL_ENDPOINT` and frontend runtime defaults to `real-spec-template/front/.env.example` for local SPA operation.
- [X] T003 [P] Align shared dependencies for sales workflow in `real-spec-template/back/package.json` and `real-spec-template/front/package.json`.
- [X] T004 Define no-auth GraphQL client bootstrap in `real-spec-template/front/lib/apollo-client.ts`.
- [X] T005 Build the sales SPA entry structure in `real-spec-template/front/src/app/index.tsx`, `real-spec-template/front/src/app/dashboard/sales/page.tsx`, and `real-spec-template/front/src/app/dashboard/delayed/page.tsx`.
- [X] T006 [P] Create shared sales types and utility files in `real-spec-template/front/src/store/sales/types.ts` and `real-spec-template/front/src/lib/sales/sales-utils.ts`.

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T007 Extend `real-spec-template/back/src/app.env.ts` with Mongo/Postgres ingestion and worker controls used by sales.
- [X] [P] T008 Expand `real-spec-template/back/src/modules/sales/sales.types.ts` enums, list filter/sort input, and operational payload models.
- [X] T009 Add schema-first GraphQL declarations in `real-spec-template/back/schema.graphql` for `salesList`, `saleById`, `delayedSales`, and mutation contracts from `specs/001-sales-operations-dashboard/contracts/graphql-api.md`.
- [X] T010 [P] Ensure backend module wiring for sales in `real-spec-template/back/src/modules/sales/sales.module.ts` and `real-spec-template/back/src/app.module.ts`.
- [X] T011 [P] `real-spec-template/back/src/modules/sales/sales-db.module.ts` should expose Postgres pool configuration for the sales database.
- [X] T012 Define sales persistence schema in `real-spec-template/back/src/modules/sales/sales-schema.ts` including `sales`, `tags`, `sale_tags`, `sale_comments`, `users`, `ingestion_state`, and `sale_ingestion_runs` tables.
- [X] T013 [P] `real-spec-template/back/src/modules/sales/sales.repository.ts` should initialize schema and expose CRUD helpers used by all sales stories.
- [X] T014 Update `real-spec-template/back/src/modules/sales/sales.resolver.ts` to remove sales auth guard usage while auth strategy is deferred.
- [X] T015 [P] Align code generation config in `real-spec-template/back/codegen.yml`, `real-spec-template/front/codegen.yml`, and generated types output paths.
- [X] T016 [P] Add base front-side GraphQL document loading in `real-spec-template/front/src/graphql/index.ts` and generated artifact output in `real-spec-template/front/src/generated/graphql.tsx`.

## Phase 3: User Story 1 - Monitor and triage incoming sales (Priority: P1)

### Goal
Deliver a single-screen sales list with table and board toggles and robust visibility of read-only + operational summary fields.

### Independent Test
Open the Sales page and verify both table and board views display the same sales data with editable summary fields visible and read-only source values protected.

- [X] T017 [US1] `real-spec-template/back/src/modules/sales/sales.repository.ts` implement `listSales` SQL with pagination, sort, search, status, tags, delay, and overdue filters.
- [X] T018 [US1] `real-spec-template/back/src/modules/sales/sales.service.ts` implement `salesList` orchestration and read-only/owner mapping rules.
- [X] T019 [US1] `real-spec-template/back/src/modules/sales/sales.resolver.ts` add `salesList` resolver and expose pagination payload.
- [X] T020 [US1] `real-spec-template/back/src/modules/sales/sales.resolver.ts` add `saleById` resolver for detail read models.
- [X] [P] T021 [US1] `real-spec-template/front/src/graphql/queries/sales.graphql` add `SalesList` and `SaleById` queries matching contract.
- [X] T022 [US1] `real-spec-template/front/src/store/sales/sales-list.store.ts` create filters/sort/search state and query orchestration.
- [X] T023 [US1] `real-spec-template/front/src/components/sales/SalesTable.tsx` render table rows with identifiers, created/updated timestamps, status, delay, problem, tags, and owner.
- [X] T024 [US1] `real-spec-template/front/src/components/sales/SalesBoard.tsx` render status columns (`Received`, `Completed`, `Delayed`, `Problem`) and card rows.
- [X] T025 [US1] `real-spec-template/front/src/components/sales/SalesViewToggle.tsx` implement table/board mode switch reused by the Sales page.
- [X] T026 [US1] `real-spec-template/front/src/components/sales/SalesFilters.tsx` add quick filter controls for status, delay presence, search, and tag filters.
- [X] [P] T027 [US1] `real-spec-template/front/src/components/sales/SalesLoadingStates.tsx` add loading, empty, and error+retry UIs.
- [X] T028 [US1] `real-spec-template/front/src/app/dashboard/sales/page.tsx` compose layout, wire queries, and route selection to Sale Details.

## Phase 4: User Story 2 - Focus on delayed sales first (Priority: P1)

### Goal
Expose a delayed-only view with urgency-first sorting and overdue emphasis.

### Independent Test
Open delayed page and confirm only delayed sales are shown, sorted by earliest `deliveryDelayAt`, with overdue status clearly visible.

- [X] T029 [US2] `real-spec-template/back/src/modules/sales/sales.service.ts` implement `delayedSales` as delayed-only query with configurable sort.
- [X] T030 [US2] `real-spec-template/back/src/modules/sales/sales.resolver.ts` add `delayedSales` GraphQL query.
- [X] T031 [US2] `real-spec-template/back/src/modules/sales/sales.repository.ts` optimize delayed query path for stable ordering and count metadata.
- [X] [P] T032 [US2] `real-spec-template/front/src/graphql/queries/sales.graphql` add `DelayedSales` query and overdue fields.
- [X] T033 [US2] `real-spec-template/front/src/app/dashboard/delayed/page.tsx` implement delayed-only screen using shared filters and list renderer.
- [X] T034 [US2] `real-spec-template/front/src/components/sales/DelayedSalesBadge.tsx` and `real-spec-template/front/src/components/sales/DelayedSalesTable.tsx` implement overdue highlight and urgency-first ordering.

## Phase 5: User Story 3 - Update only operational fields (Priority: P2)

### Goal
Enable controlled updates of status, delay, and problem_reason, while preserving immutable source fields.

### Independent Test
Open a Sale Details view, update a status/delay/problem field, save, then verify list/detail reflect only permitted fields.

- [X] T035 [US3] `real-spec-template/back/src/modules/sales/sales.repository.ts` add atomic mutations for status, delay, and problem_reason.
- [X] T036 [US3] `real-spec-template/back/src/modules/sales/sales.repository.ts` enforce that source fields remain unchanged on mutation operations.
- [X] T037 [US3] `real-spec-template/back/src/modules/sales/sales.service.ts` coordinate mutation validation and return updated sale payload.
- [X] T038 [US3] `real-spec-template/back/src/modules/sales/sales.resolver.ts` add `updateSaleStatus`, `updateSaleDelay`, `updateSaleProblem` resolvers.
- [X] [P] T039 [US3] `real-spec-template/front/src/graphql/mutations/sales.graphql` add mutation documents for status, delay, and problem updates.
- [X] T040 [US3] `real-spec-template/front/src/store/sales/sale-detail.mutations.ts` add mutation hooks and stale-update guard.
- [X] T041 [US3] `real-spec-template/front/src/components/sales/SaleEditableFields.tsx` add controls for status dropdown, delay datetime, and problem reason.
- [X] T042 [US3] `real-spec-template/front/src/components/sales/SaleDetailPage.tsx` wire form state, edit persistence, and success/error states.
- [X] T043 [US3] `real-spec-template/front/src/app/dashboard/sale/page.tsx` show read-only source payload and forbid edits to source fields.

## Phase 6: User Story 4 - Collaborate with comments and ownership (Priority: P2)

### Goal
Support tags, assignment, and comments on a sale with immediate visibility and persistence.

### Independent Test
Add/remove a tag and owner, append a comment, then verify sale details and list remain in sync.

- [X] T044 [US4] `real-spec-template/back/src/modules/sales/sales.repository.ts` add idempotent tag mutation methods and comment insertion with author resolution.
- [X] T045 [US4] `real-spec-template/back/src/modules/sales/sales.service.ts` add tag/comment orchestration for deterministic ordering.
- [X] T046 [US4] `real-spec-template/back/src/modules/sales/sales.resolver.ts` add `addSaleTag`, `removeSaleTag`, `addSaleComment` and ownership mutation fields.
- [X] [P] T047 [US4] `real-spec-template/front/src/graphql/mutations/sales.graphql` add `addSaleTag`, `removeSaleTag`, `addSaleComment`, and `setSaleFilledBy` documents.
- [X] [P] T048 [US4] `real-spec-template/front/src/graphql/queries/sales.graphql` add a `listUsersForAssignment` query for owner selection.
- [X] T049 [US4] `real-spec-template/front/src/store/sales/sale-detail.store.ts` add in-memory ownership/tag/comment command handlers.
- [X] T050 [US4] `real-spec-template/front/src/components/sales/SaleTags.tsx` add tag input, chip rendering, add/remove interactions.
- [X] T051 [US4] `real-spec-template/front/src/components/sales/FilledBySelector.tsx` add owner selection and assignment mutation integration.
- [X] T052 [US4] `real-spec-template/front/src/components/sales/SaleComments.tsx` add append-only comment timeline.
- [X] T053 [US4] `real-spec-template/front/src/components/sales/SaleDetailPage.tsx` compose tags, owner, and comments into single detail view.

## Phase 7: User Story 5 - Preserve edits through ingestion (Priority: P3)

### Goal
Guarantee ingestion runs repeatedly without overwriting manual operational values.

### Independent Test
Edit a sale, force ingestion, and verify source updates do not remove operational changes.

- [X] T054 [US5] `real-spec-template/back/src/modules/sales/sales-ingestion.service.ts` implement cursor-based Mongo polling at configured interval (3 minutes by default).
- [X] T055 [US5] `real-spec-template/back/src/modules/sales/sales-ingestion.service.ts` map incoming Mongo documents via source-safe normalizers for `creationDate`, `statusChangeDate`, ids, and nullable values.
- [X] T056 [US5] `real-spec-template/back/src/modules/sales/sales.repository.ts` implement upsert with immutable source update and preserved operational fields.
- [X] T057 [US5] `real-spec-template/back/src/modules/sales/sales.repository.ts` maintain `ingestion_state` cursor and log run start/finish/failure in `sale_ingestion_runs`.
- [X] T058 [US5] `real-spec-template/back/src/modules/sales/sales-ingestion.service.ts` add overlapping-run guard, batch bounds, and error resilience.

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T059 [P] `real-spec-template/front/src/components/sales/SalesPageErrorBoundary.tsx` add error boundaries and inline retry actions for list/detail screens.
- [X] T060 [P] `real-spec-template/front/src/styles/globals.css` finalize overdue/state styles and compact sale card/table visual hierarchy.
- [X] T061 [P] `specs/001-sales-operations-dashboard/quickstart.md` update local run instructions for no-auth frontend/backend smoke checks.
- [X] T062 [P] `real-spec-template/back/src/modules/sales/sales.service.ts` and `real-spec-template/front/src/app/dashboard/sale/page.tsx` standardize stale-edit warning messaging when sale `updatedAt` changed while editing.

## Dependencies and Execution Order

- Setup must complete before Foundational.
- Foundational must complete before all user stories.
- US1 and US5 can start in parallel after foundational.
- US2 depends on US1 foundation behavior (shared list query and filter components).
- US3 depends on US1 detail views and mutation infra.
- US4 depends on US1 and US3 because tags/comments/owner actions are on detail surfaces.
- Final phase depends on all completed user stories.

## Task Count by User Story

- Setup: 6 tasks.
- Foundational: 10 tasks.
- US1: 12 tasks.
- US2: 6 tasks.
- US3: 9 tasks.
- US4: 10 tasks.
- US5: 5 tasks.
- Polish: 4 tasks.
- Total: 62 tasks.

## Parallel Execution Opportunities

- Phase 1 setup tasks T003, T006 are independent and parallelizable.
- Foundational tasks T008, T010, T011, T013, T015, and T016 can run in parallel.
- In US1, backend query tasks T017 and T019 can run in parallel with frontend query task T021.
- In US2, backend resolver/read-path task T030 can run in parallel with UI tasks T033 and T034.
- In US3, backend mutation tasks T035, T036, and T038 can run in parallel with frontend mutation docs tasks T039 and US4-specific components preparation.
- In US4, query/mutation document tasks T047 and T048 can run in parallel with component tasks T050, T051, and T052.

## Implementation Strategy

- Build Strategy (MVP first): complete Setup -> Foundational -> US1 and stop for validation.
- Incremental delivery: after US1, add US2, then US3, then US4, then US5.
- Keep each phase independently testable using contract-aligned queries and mutations.
