# Implementation Plan: Sales Operations Dashboard Refinement

**Branch**: `[002-sales-dashboard-refinement]` | **Date**: `2026-02-25` | **Spec**: `specs/002-sales-dashboard-refinement/spec.md`
**Input**: Feature specification from `/specs/002-sales-dashboard-refinement/spec.md`

## Summary

Move the dashboard to a single Nest.js process with Drizzle ORM-backed persistence, migrate UI elements to ShadCN patterns, and add card-level draggable board status movement with immediate, conflict-safe persistence. Also modernize tag filtering to support existing-tag suggestions + typed multi-select with OR matching.

## Technical Context

**Language/Version**: TypeScript (Node.js + React 19)  
**Primary Dependencies**: `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `@apollo/client`, `@tanstack/react-query`, `drizzle-orm`, `@dnd-kit` (or equivalent), `react-router-dom`  
**Storage**: PostgreSQL as dashboard data store and MongoDB as ingestion source  
**Testing**: `jest` (backend), TypeScript typecheck, Vite build/typecheck frontend, Playwright/manual acceptance checks  
**Target Platform**: Internal web dashboard (desktop + mobile), Node backend server  
**Project Type**: Web application (backend + frontend in mono-repo directories)  
**Performance Goals**: Drag-to-status update visible across board and list within 3 seconds (P95 target aligned to SC-001)  
**Constraints**: Schema-first GraphQL contract is required; single process runtime; ShadCN-first UI implementation  
**Scale/Scope**: Internal operations users, thousands of sales/day with tag-filtered board/list browsing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Single-process runtime is enforced across all paths (leader/worker launch modes have been removed).
- [ ] Drizzle ORM migration is included as explicit migration plan for sales/tag/comment/user/ingestion metadata reads/writes.
- [ ] ShadCN component standard is used for board/list/detail/sidebar surfaces and new/updated widgets.
- [x] GraphQL contract remains source of truth and frontend types are generated, not hand-edited.
- [x] Per-phase verification pipeline includes back-end TypeScript build, backend tests, and front-end typecheck/build.

## Documentation (this feature)

```text
specs/002-sales-dashboard-refinement/
├── plan.md                # This file (/speckit.plan command output)
├── research.md            # Phase 0 outputs
├── data-model.md          # Phase 1 outputs
├── quickstart.md          # Phase 1 outputs
├── contracts/             # Phase 1 outputs
│   └── graphql-api.md
└── tasks.md               # `/speckit.tasks` output (not created by /speckit.plan)
```

## Source Code (repository)

```text
back/
├── src/
│   ├── app.module.ts
│   ├── main-launch.ts
│   ├── modules/
│   │   ├── graphql.module.ts
│   │   └── sales/
│   ├── shared/
│   └── logger/
├── src/
├── schema.graphql
├── package.json
└── codegen.yml

front/
├── src/
│   ├── app/
│   ├── components/
│   ├── generated/
│   ├── graphql/
│   ├── lib/
│   ├── store/
│   ├── main.tsx
│   └── index.css
├── package.json
└── codegen.yml
```

**Structure Decision**: Keep current two-package layout (`back/`, `front/`) and migrate behavior across existing modules/services/components rather than introducing new app boundaries.

## Phase 0: Research

### Research Outputs (`research.md`)

`research.md` addresses architecture and implementation decisions required for this refinement:

- Drizzle adoption approach and migration patterns for existing data-access paths.
- Single-process Nest unification strategy replacing leader/worker runtime branching.
- ShadCN-compliant component reuse policy for board/list/detail/sidebar UI.
- Drag-and-drop library and stale-move behavior.
- Tag suggestion query design and OR matching semantics.
- ESLint baseline migration strategy from template reference into this repository.

### Dependencies & Best Practices Tasks

- Confirm Drizzle setup path for PostgreSQL and migration lifecycle.
- Confirm drag-and-drop interaction patterns that preserve optimistic UI and rollback safety.
- Confirm tag filtering UX: focus-to-open suggestion list + free-form additions + multiple selection.
- Validate stale-move error pattern across direct and board-originated status mutations.

## Phase 1: Design & Contracts

### Data model and validation rules (`data-model.md`)

`data-model.md` defines:

- Concrete entity shapes for `Sale`, `User`, `SaleTag`, `SaleComment`, and ingestion metadata.
- Editable vs read-only fields for each domain object.
- Validation and consistency rules (state transitions, tag semantics, stale guards).
- Multi-actor data races and merge behavior with ingestion updates.

### Interface contracts (`contracts/`)

`contracts/graphql-api.md` defines/updates:

- baseline query/mutation contracts currently present
- required tag suggestion query for filter autocomplete
- clarified stale-write semantics for `updateSaleStatus`
- OR-match filtering behavior for `tagIds`
- generated-type regeneration workflow obligations

### Agent context update

Run:

```bash
.specify/scripts/bash/update-agent-context.sh codex
```

after updating planning artifacts, adding only new technology context (for example Drizzle and drag-and-drop pattern decisions) in the agent-specific section.

### Quickstart

`quickstart.md` includes:

- setup, environment, and boot commands
- contract/codegen workflow after schema edits
- required per-phase verification commands

## Complexity Tracking

| Violation / risk | Why Needed | Simpler Alternative Rejected Because |
|------------------|------------|-------------------------------------|
| Consolidation of leader/worker into single app | Completed in current branch; startup, ingestion, and API now run from one backend entrypoint | Maintaining two modes duplicates bootstrap, scheduling, and operational posture |
| Adding tag suggestion API path | Required for discoverable multi-select UX | Inference from sales list alone does not scale and duplicates query logic |
| Introducing drag-and-drop conflict handling | Required by FR-007 and FR-014 | Blind writes would lose concurrent-update correctness and violate stale behavior |
| Drizzle migration before full UI refactor | Required for ORM consistency and governance | Postponing migration increases cross-phase complexity and mixed data access patterns |
