# Tasks: Sales Operations Dashboard Refinement

**Input**: Design documents from `/specs/002-sales-dashboard-refinement/`
**Prerequisites**: plan.md, spec.md

## Format

- [ ] T### [P?] [USx?] Description with file path
- **[P]**: Can run in parallel (different files, no dependencies)
- **[USx]**: Task belongs to user story x

## Phase Quality Guardrail

- [X] PT-GATE Execute `scripts/phase-gate.sh` at the end of each phase before marking phase tasks as completed.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Copy ESLint configuration from template project into backend: `reference/real-spec/back/eslint.config.mjs` -> `back/eslint.config.mjs` (create if missing)
- [X] T002 [P] Align frontend lint config baseline to backend style and repo tooling in `front/package.json` scripts
- [X] T003 [P] Add/verify `front/eslint.config.mjs` and/or `.eslintrc` path expected by workspace tooling
- [X] T004 [P] Add `back/drizzle.config.ts` and baseline `drizzle.config.ts` script assumptions in `back/package.json`
- [X] T005 Add `back/src/db` directory for shared DB wiring
- [X] T006 Add `front/src/lib/sort` utility folder for DnD/drag ordering helpers in `front/src/lib`

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Add typed Drizzle schema base file `back/src/modules/sales/db/schema.ts` for sales, tags, users, comments, ingestion metadata tables
- [X] T008 [P] Create Drizzle client bootstrap `back/src/modules/sales/db/client.ts` and PostgreSQL connection helper in `back/src/modules/sales/db/connection.ts`
- [X] T009 [P] Add migration entrypoint and migration scripts in `back/package.json` and `back/migrations`
- [X] T010 Add repository abstraction for Drizzle operations in `back/src/modules/sales/sales.repository.ts`
- [X] T011 [P] Update `back/src/modules/sales/sales.types.ts` to include `updatedAt`/`expectedUpdatedAt` typed flow for stale-checks
- [X] T012 [P] Replace raw query paths in `back/src/modules/sales/sales-ingestion.service.ts` with shared Drizzle repository calls
- [X] T013 [P] Update `back/src/shared/env` and `back/src/app.env.ts` for unified runtime defaults and Drizzle-required settings
- [X] T014 Ensure `back/schema.graphql` remains authoritative by adding missing types/comments for Drizzle-backed metadata and required fields
- [X] T015 [P] Normalize startup path in `back/src/main-launch.ts` for single app launch sequence
- [X] T016 Remove/replace legacy dual-launch mode entrypoints:
  - `back/src/leader-launch.ts`
  - `back/src/worker-launch.ts`

## Phase 3: User Story 1 - Single Runtime + Operational Merge Safety (Priority: P1) 🎯 MVP

**Goal**: Run API, GraphQL, and ingestion in one Nest.js process while preserving operational edits.

**Independent Test**: Start application in regular mode and verify sales, board, delayed, and detail operations work without leader/worker toggles.

- [X] T017 [US1] Update Nest bootstrap registration in `back/src/app.module.ts` to remove dual-mode split dependencies
- [X] T018 [US1] Wire ingestion scheduling/services into normal module loading in `back/src/main-launch.ts`
- [X] T019 [US1] Update `back/src/modules/sales/sales-ingestion.service.ts` to run from unified runtime
- [X] T020 [P] [US1] Merge operational-edit guard logic into ingestion write path in `back/src/modules/sales/sales.service.ts`
- [X] T021 [US1] Remove leader/worker environment branching in `back/package.json` scripts and add single `start` command semantics
- [X] T022 [US1] Update docs of runtime behavior in `specs/002-sales-dashboard-refinement/quickstart.md`

## Phase 4: User Story 2 - Drizzle ORM Persistence Migration (Priority: P2)

**Goal**: Route sales, tag, user, comment, and ingestion metadata operations through Drizzle ORM.

**Independent Test**: Execute representative queries/mutations and verify all requested flows hit Drizzle repositories.

- [X] T023 [P] [US2] Migrate sale read paths in `back/src/modules/sales/sales.repository.ts` to Drizzle query builders
- [X] T024 [US2] Migrate list/detail GraphQL resolvers in `back/src/modules/sales/sales.resolver.ts` to repository-backed calls
- [X] T025 [P] [US2] Migrate `updateSaleStatus`, `updateSaleDelay`, `updateSaleProblem`, `setSaleFilledBy` mutations to Drizzle-backed write methods in `back/src/modules/sales/sales.service.ts`
- [X] T026 [US2] Migrate tag persistence helpers (`addSaleTag`, `removeSaleTag`) and comments path to Drizzle in `back/src/modules/sales/sales.repository.ts`
- [X] T027 [P] [US2] Migrate user lookup and assignment data reads in `back/src/modules/sales/sales.service.ts`
- [X] T028 [P] [US2] Migrate ingestion metadata persistence in `back/src/modules/sales/sales-ingestion.service.ts`
- [X] T029 [US2] Add transaction boundaries and version-safe merge logic in `back/src/modules/sales/sales.service.ts`
- [X] T030 [P] [US2] Add migration verification queries and seed sanity checks in `back/src/modules/sales/sales-db.module.ts`

## Phase 5: User Story 3 - Draggable Board Status Updates + Stale Protection (Priority: P3)

**Goal**: Allow drag-and-drop between all four board columns with immediate persisted status updates and stale conflict handling.

**Independent Test**: Drag a sale card between columns and verify immediate status sync on board + list/detail, plus stale rejection rollback.

- [X] T031 [P] [US3] Keep GraphQL mutation contract in `back/schema.graphql` and include stale guard field in status mutation arguments
- [X] T032 [US3] Add stale timestamp validation and conflict error in `back/src/modules/sales/sales.service.ts:updateSaleStatus`
- [X] T033 [US3] Ensure list/detail payloads include `updatedAt` for concurrency in `back/src/modules/sales/sales.resolver.ts`
- [X] T034 [P] [US3] Add status transition constants and validation helpers in `front/src/lib/sales/status.ts`
- [X] T035 [P] [US3] Refactor board column model to a mapped enum in `front/src/app/dashboard/sales`
- [X] T036 [US3] Implement drag-drop interaction container in `front/src/components/sales/BoardDraggableBoard.tsx`
- [X] T037 [P] [US3] Integrate `@dnd-kit` drag context and collision handlers in `front/src/components/sales/BoardDraggableBoard.tsx`
- [X] T038 [US3] Wire drop handler to mutation call in `front/src/store/sales` and pass `expected_updated_at`
- [X] T039 [US3] Add optimistic move + rollback state handling and warning event in `front/src/app/dashboard/sales`
- [X] T040 [US3] Invalidate and refresh affected sale queries after board move in `front/src/store/sales/sales.queries.ts`

## Phase 6: User Story 4 - Tag Suggestion Search with Multi-Select + Typing (Priority: P4)

**Goal**: Provide existing-tag discoverability and free-form multi-select for filtering with OR semantics.

**Independent Test**: Open tag selector, use focus suggestions + type new tag, select multiple values, and validate OR-based results.

- [X] T041 [P] [US4] Extend contract for tag suggestions in `back/schema.graphql` (`tags` query input/output)
- [X] T042 [US4] Implement suggestion query resolver in `back/src/modules/sales/sales.resolver.ts`
- [X] T043 [US4] Implement tag suggestion data access in `back/src/modules/sales/sales.repository.ts`
- [X] T044 [US4] Regenerate frontend GraphQL types in `front/src/generated/graphql.tsx` via `front/npm run codegen:graphql`
- [X] T045 [P] [US4] Build multi-select tag control with suggestion dropdown in `front/src/components/sales/TagFilterInput.tsx`
- [X] T046 [US4] Persist typed and selected tags through existing filter flow in `front/src/store/sales/sales.filters.ts`
- [X] T047 [US4] Apply OR-match filter semantics in backend filter parser in `back/src/modules/sales/sales.service.ts`

## Phase 7: User Story 5 - ShadCN Standard UI Refactor (Priority: P5)

**Goal**: Migrate dashboard presentation to ShadCN component patterns, including shell and board surfaces.

**Independent Test**: Verify Sales, Delayed, and Detail routes use shared ShadCN shell and controls with consistent behavior.

- [ ] T048 [P] [US5] Replace/align sales table controls in `front/src/components/sales/SaleListPage.tsx` with local UI primitives
- [ ] T049 [US5] Replace/align board card controls and containers in `front/src/components/sales/SaleBoardCard.tsx`
- [ ] T050 [P] [US5] Replace sidebar shell shell in `front/src/app/dashboard` to ShadCN `sidebar` primitives
- [ ] T051 [US5] Rework filter pane controls in `front/src/app/dashboard/sales` to use ShadCN input/select components
- [ ] T052 [US5] Align delayed route UI to the same component system in `front/src/app/dashboard/delayed`
- [ ] T053 [US5] Rework sale detail page interactions in `front/src/app/dashboard/sale`

## Final Phase: Polish & Cross-Cutting Concerns

- [ ] T054 [P] Run backend verification pipeline from repository constitution: `cd back && npm run build`
- [ ] T055 [P] Run backend tests: `cd back && npm run test`
- [ ] T056 [P] Run frontend typecheck/build: `cd front && npm run typecheck` and `cd front && npm run build`
- [ ] T057 [P] Reconcile schema/type generation source-of-truth after contract changes (`front/npm run codegen:graphql`)
- [ ] T058 [P] Update runbook in `specs/002-sales-dashboard-refinement/quickstart.md` for unified runtime + Drizzle + drag-drop verification flow
- [ ] T059 [P] Remove stale worker/leader references from developer docs in `AGENTS.md` and related docs

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup completion.
- **US1**: Depends on Foundation.
- **US2**: Depends on Foundation.
- **US3**: Depends on US1 + US2.
- **US4**: Depends on US2.
- **US5**: Depends on Setup + Foundation; can run with US3/US4 once baseline primitives and style setup are present.
- **Polish**: Depends on all completed user stories and Foundation.

### Story-level dependency order

1. US1 → 2. US2 → 3. US3
2. US2 → 4. US4
3. US2 → 5. US5

## Parallel Opportunities

- Setup and foundational [P] tasks can be parallelized.
- US3: T034/T035/T036/T037 can run in parallel with each other after resolver/service contract boundaries are set.
- US4: T045 and T046 can run in parallel after GraphQL types exist.
- US5: T048/T049/T051 can be parallelized after component inventory is confirmed.
- Polish checks (T054, T055, T056, T057) can run once code complete.

## Implementation Strategy

### MVP First

1. Complete Setup + Foundational phases.
2. Complete US1 (single-process + ingestion continuity).
3. Stop and run quick verification command set.
4. Add US2 only if ORM persistence is the required minimum for release.

### Incremental Delivery

1. Complete US1 → deliver unified runtime.
2. Complete US2 → deliver persistence discipline.
3. Complete US3 → deliver board status interaction.
4. Complete US4 → deliver improved tag filtering.
5. Complete US5 → deliver UI system consistency.
