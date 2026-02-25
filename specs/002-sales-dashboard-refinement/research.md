# Research Notes: Sales Operations Dashboard Refinement

## Decision: Drizzle ORM adoption for persistence

- Decision: Use Drizzle ORM (with `drizzle-orm` + `@neondatabase/serverless`/`pg`) for sales, tags, comments, users, and ingestion metadata access paths in backend services, replacing ad-hoc query execution layers.
- Rationale: Existing stack is TypeScript/Nest, and schema-backed querying is already expected by prior ORM-transition direction. Drizzle provides migration support, typed SQL, and manageable incremental migration from current repository-level data access.
- Alternatives considered:
  - Keep raw SQL helpers: rejected because it would keep inconsistent persistence patterns and increase regression risk for Drizzle migration scope.
  - Prisma: rejected to align with repository preference and lower migration/tooling churn.

## Decision: Single-process Nest runtime

- Decision: Collapse leader/worker behavior into a single Nest application process and run ingestion side-effects via injectable providers/services inside the same app module graph.
- Rationale: Directly required by the specification and constitution; simplifies local operation and removes launch mode branching (`APP_MODE=leader|worker` paths).
- Alternatives considered:
  - Retain two processes (leader + worker): rejected because it violates the unified-runtime requirement and introduces extra orchestration overhead.
  - External job queue service: rejected as out of scope and adds new infra dependency for this refinement.

## Decision: Board card drag-and-drop

- Decision: Use a proven DnD library (preferably `@dnd-kit`) for board card movement across all four status columns with immediate mutation calls and optimistic UI updates.
- Rationale: Supports accessible keyboard/mouse interactions, granular drag states, and straightforward column-over-column drop logic.
- Alternatives considered:
  - Manual up/down actions and status select: rejected because spec requires cards to be draggable.
  - HTML5 native drag only: rejected due inconsistent behavior and complex touch/mobile edge handling.

## Decision: Tag suggestions input behavior

- Decision: Add query path for existing tags (e.g., `tagSuggestions`/`allTags`) used by the filter control, with multi-select and free-form entry.
- Rationale: Current schema already supports tag names on mutations (`addSaleTag`), but UI currently needs discoverability of existing tags and manual entry fallback.
- Alternatives considered:
  - Use static list from `salesList` queries only: rejected because it does not provide dedicated suggestion API and scales poorly.
  - Hardcode known tags: rejected due staleness and operational drift.

## Decision: Stale move handling

- Decision: Keep optimistic drag updates with server-side validation by `expected_updated_at`; if stale, roll back card to source column and show refresh warning.
- Rationale: Matches clarification and avoids overwriting newer changes in high-collision cases.
- Alternatives considered:
  - Blind overwrite: rejected because it violates stale protection requirement.
  - Disable optimistic updates and always refetch before move: rejected for UX latency and reduced interactivity.

## Decision: Contract and typing process

- Decision: Keep `back/schema.graphql` as the single contract source and continue generating frontend/backend TS types from schema (`front/npm run codegen:graphql`).
- Rationale: Already codified in repository constitution and aligns with schema-first architecture.
- Alternatives considered:
  - Hand-maintain TS interface files: rejected to prevent drift and breakage.

## Decision: ESLint configuration migration

- Decision: Ingest lint configuration baseline from reference template project into this repo during phase 0, then converge both backend and frontend scripts and rule overrides to the existing project context.
- Rationale: Explicit user scope item and required first-phase quality setup.
- Alternatives considered:
  - Reuse existing config: rejected because this phase specifically asks template migration first.
  - Ad-hoc config rewrite: rejected due risk of divergence and inconsistent enforcement.
