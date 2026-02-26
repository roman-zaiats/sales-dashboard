# Tasks: Remove Sale Source Fields

**Input**: Design documents from `/specs/003-remove-sale-source-fields/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the workspace and align on impacted surfaces before implementation.

- [ ] T001 Confirm working directory and branch context for `/Users/romanzaiats/.codex/worktrees/0e06/sales-dashboard` and keep `003-remove-sale-source-fields` active.
- [ ] T002 [P] Install or refresh workspace dependencies in `back/` and `front/` before schema/data edits.
- [ ] T003 [P] Record current impacted field usage in `specs/003-remove-sale-source-fields/contracts/graphql-api.md` and `specs/003-remove-sale-source-fields/data-model.md` for implementation reference.
- [ ] T004 Run `./scripts/phase-gate.sh` and block Phase 2 start until the gate passes cleanly.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make sure foundational artifacts are ready before story implementation.

- [ ] T005 [P] Baseline migration and contract touchpoints in `back/schema.graphql`, `back/src/modules/sales/db/schema.ts`, and `back/src/modules/sales/sales-schema.ts`.
- [ ] T006 Confirm field usage inventory for old fields in source code (e.g., `externalSaleId`, `sourcePayload`) using `rg` and stage removal map in the implementation notes (`specs/003-remove-sale-source-fields/checklists/requirements.md`).
- [ ] T007 [P] Align backend and frontend generation process in `front/package.json` and `front/codegen.yml` as required for schema-first type regeneration after contract edits.
- [ ] T008 Add a migration run checklist to `specs/003-remove-sale-source-fields/quickstart.md` for backend-first execution order and rollback verification.
- [ ] T009 Run `./scripts/phase-gate.sh` and block US1 start until the gate passes with no failures.

---

## Phase 3: User Story 1 - Clean Data Model Before UI Changes (Priority: P1) 🎯 MVP

**Goal**: Remove legacy source-only fields from Postgres schema and core backend types/contracts so dashboards no longer persist or expose them.

**Independent Test**: After backend work, calling sales queries/mutations returns payloads with no `externalSaleId` and no `sourcePayload` while preserving required operational fields and list/detail filtering behavior.

### Implementation for User Story 1

- [ ] T010 [US1] Update core DB schema in `back/src/modules/sales/db/schema.ts` to remove `externalSaleId` and `sourcePayload` from `sales` and `listings` ORM table definitions.
- [ ] T011 [US1] Update SQL migration SQL in `back/src/modules/sales/sales-schema.ts` to remove legacy columns and keep existing constraints/order for remaining entities.
- [ ] T012 [P] [US1] Remove `externalSaleId` and `sourcePayload` from backend API output models in `back/src/modules/sales/sales.types.ts`.
- [ ] T013 [US1] Update backend contract by removing legacy fields from `Sale` and `Listing` in `back/schema.graphql`.
- [ ] T014 [P] [US1] Update repository mapping in `back/src/modules/sales/sales.repository.ts` for sale/listing reads, writes, and upsert payload shaping without these fields.
- [ ] T015 [US1] Update seed and ingest mapping pipeline to stop persisting removed fields: `back/seed-sales-fixtures.mjs`, `back/src/modules/sales/sales-import.service.ts`.
- [ ] T016 [US1] Update cursor/import/aggregation behavior to avoid using removed identifiers in `back/src/modules/sales/sales-ingestion.service.ts` and keep operational upsert flow functional.
- [ ] T017 [US1] Update seed/fixture and migration consistency check references to ensure no required legacy field is referenced in `back/src/modules/sales/*.ts`.
- [ ] T018 [US1] Regenerate backend-consumed frontend GraphQL artifacts by running `cd front && npm run codegen:graphql` after `back/schema.graphql` update.
- [ ] T019 [US1] Reconcile migration safety evidence by updating `specs/003-remove-sale-source-fields/checklists/requirements.md` with explicit removal confirmation check results.
- [ ] T020 Run `./scripts/phase-gate.sh` before entering US2; fix all failures before proceeding.

---

## Phase 4: User Story 2 - Keep Operations Functions Intact (Priority: P1)

**Goal**: Preserve operational updates and read paths while running on the cleaned contract and schema.

**Independent Test**: Execute status/delay/problem/`dashboardTags`/comment/assignment flows using current sales/listing data and verify success with unchanged behavior except removed fields.

### Implementation for User Story 2

- [ ] T021 [US2] Update resolver return shaping and DTO composition in `back/src/modules/sales/sales.resolver.ts` and `back/src/modules/sales/sales.service.ts` to ensure `Sale` payloads remain complete without legacy fields.
- [ ] T022 [P] [US2] Update query path implementations in `back/src/modules/sales/sales.repository.ts` and `back/src/modules/sales/sales.service.ts` for list/detail/delayed paths after schema field removals.
- [ ] T023 [US2] Verify and preserve mutation behavior in `back/src/modules/sales/sales.repository.ts`, especially stale-check fields and updated fields for status/delay/problem/dashboardTags/comments/assignment.
- [ ] T024 [US2] Add a migration impact note in `specs/003-remove-sale-source-fields/quickstart.md` for API consumers that may still request removed fields.
- [ ] T025 [US2] Run backend API regression validation for list/detail/mutation paths and capture any required follow-up fixes.
- [ ] T026 Run `./scripts/phase-gate.sh` before US3 starts; no frontend tasks can begin until this gate passes.

---

## Phase 5: User Story 3 - Frontend Update After Upstream Sync (Priority: P2)

**Goal**: Finish frontend cleanup only after backend contract changes are complete and latest frontend changes are pulled.

**Independent Test**: Frontend build/typecheck succeeds with updated contract and no compile/runtime references to removed fields in list/detail views.

### Implementation for User Story 3

- [ ] T027 [US3] Pull latest frontend branch baseline before editing, then lock tasks to current tree state in `front/`.
- [ ] T028 [P] [US3] Update GraphQL documents `front/src/graphql/queries/sales.graphql` and `front/src/graphql/mutations/sales.graphql` to remove `externalSaleId` and `sourcePayload` selections.
- [ ] T029 [US3] Remove field usage from frontend types and helpers in `front/src/store/sales/types.ts` and `front/src/lib/sales/sales-utils.ts`.
- [ ] T030 [P] [US3] Remove UI render references in `front/src/components/sales/BoardDraggableBoard.tsx`, `front/src/components/sales/DelayedSalesTable.tsx`, `front/src/app/dashboard/sale/page.tsx`.
- [ ] T031 [US3] Update any additional screen-level selectors/views that still reference legacy fields (e.g., sale detail and board-related components under `front/src/components/sales/`).
- [ ] T032 [US3] Regenerate frontend GraphQL types with `cd front && npm run codegen:graphql` and clean up type usage fallout across `front/src/**/*.ts(x)`.
- [ ] T033 [US3] Run frontend checks (`cd front && npm run typecheck` and `cd front && npm run build`) and fix compile-time regressions.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Finalize rollout notes, consistency checks, and multi-phase verification.

- [ ] T034 Perform final backend+frontend run of `./scripts/phase-gate.sh` and log results in `specs/003-remove-sale-source-fields/research.md`.
- [ ] T035 [P] Run final field-removal audit with one scan of backend and frontend references to `externalSaleId`/`sourcePayload`.
- [ ] T036 [P] Add migration and rollout notes in `specs/003-remove-sale-source-fields/quickstart.md` for consumers and deploy runbook owners.
- [ ] T037 Update `specs/003-remove-sale-source-fields/checklists/requirements.md` after all tasks complete to reflect final verification status.

## Dependencies & Execution Order

- **Phase 1**: No dependencies.
- **Phase 2**: Depends on Phase 1 and completion of phase-gate task T004.
- **Phase 3 (US1)**: Depends on Phase 2 and completion of phase-gate task T009.
- **Phase 4 (US2)**: Depends on Phase 2, US1 data-schema cleanup, and completion of phase-gate task T020.
- **Phase 5 (US3)**: Depends on full Phase 3, explicit latest frontend pull in T027, and completion of phase-gate task T026.
- **Final Phase**: Depends on Phases 3, 4, and 5, and successful final phase-gate task T034.

### User Story Dependencies

- **US1**: Foundation-complete only.
- **US2**: Requires US1 schema/contract cleanup for payload stability.
- **US3**: Requires US1 contract completion and explicit latest frontend sync before any UI edits.

## Parallel Opportunities

- Phase 1: T002, T003 can run in parallel.
- Phase 2: T005, T007 can run in parallel; T006 supports implementation planning.
- Phase 3: T010 and T011 are parallel-safe after foundation; T014 and T015 can proceed in parallel with contract update once DB shape is settled.
- Phase 4: T022 and T021 are not fully parallel due resolver/service dependency.
- Phase 5: T028, T029, T030 can be distributed across files and run in parallel after T027.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 only and validate backend payload removal + migration safety.
3. Gate before moving to further stories.

### Incremental Delivery

1. After MVP (US1): backend contract/data cleanup is complete and safe.
2. Add US2: operations remain intact without regressions.
3. Add US3: frontend references removed after latest pull.
4. Run final polish and phase gate.

### Parallel Team Strategy

- Developer A: US1 database + backend contract cleanup.
- Developer B: US2 mutation/read-path compatibility with backend services.
- Developer C: US3 frontend contract and UI cleanup (after pull).
