# Implementation Plan: Remove Sale Source Fields

**Branch**: `[003-remove-sale-source-fields]` | **Date**: `2026-02-26` | **Spec**: `specs/003-remove-sale-source-fields/spec.md`
**Input**: Feature specification from `/specs/003-remove-sale-source-fields/spec.md`

## Summary

Remove `externalSaleId` and `sourcePayload` from sales/listing data storage and API contracts, while preserving all operational workflows for status, delays, problems, `dashboardTags`, comments, and assignment. Complete the schema + backend cleanup first, then execute a separate front-end cleanup phase after pulling the latest frontend baseline.

## Reference Boundary

No reference template is introduced for this change. Implement the update directly in the active `back/` and `front/` trees for this repository, using the existing `back/schema.graphql` contract-first flow.

## Technical Context

**Language/Version**: TypeScript (Node.js + React 19)  
**Primary Dependencies**: `@nestjs/common`, `@nestjs/graphql` (schema-first), `@apollo/server`, `drizzle-orm`, `@apollo/client`  
**Storage**: PostgreSQL for persisted sales/listings, MongoDB for ingestion source input  
**Testing**: `jest` for backend tests, `tsc` typecheck plus frontend build for UI verification, and GraphQL contract regeneration check  
**Target Platform**: Internal web dashboard (backend API + browser frontend)  
**Project Type**: Web application (backend + frontend services in one repository)  
**Performance Goals**: Preserve existing dashboard responsiveness while dropping contract/data payload size by removing unneeded fields.  
**Constraints**: Back-end cleanup must be completed before front-end refactor; frontend phase should start after latest frontend branch refresh.  
**Scale/Scope**: Internal operational dashboard with continuing list/detail/filter workflows over existing ticket sale volumes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Back-end and front-end phase transitions must respect the repository phase gate in `.specify/memory/constitution.md`.
- [x] `back/schema.graphql` is maintained as the canonical GraphQL contract source; generated frontend contract artifacts must be recreated via codegen.
- [x] No phase is considered complete until build/test/typecheck/build gate requirements are met.

## Phase Gate Enforcement

- `./scripts/phase-gate.sh` must be executed and pass before moving from one feature phase to the next:
  - End of Phase 1 (Setup) before Phase 2.
  - End of Phase 2 (Foundational) before User Story 1.
  - End of User Story 1 before User Story 2.
  - End of User Story 2 before User Story 3.
  - End of User Story 3 before Polish/final phase.

## Project Structure

### Documentation (this feature)

```text
specs/003-remove-sale-source-fields/
├── plan.md                # This file (`/speckit.plan` command output)
├── research.md            # Phase 0 outputs (`/speckit.plan` command)
├── data-model.md          # Phase 1 outputs (`/speckit.plan` command)
├── quickstart.md          # Phase 1 outputs (`/speckit.plan` command)
├── contracts/             # Phase 1 outputs (`/speckit.plan` command)
│   └── graphql-api.md
└── tasks.md               # `/speckit.tasks` output (not created by `/speckit.plan`)
```

### Source Code (repository)

```text
back/
├── schema.graphql
├── seed-sales-fixtures.mjs
├── src/
│   ├── modules/sales/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   └── sales-schema.ts
│   ├── modules/sales/sales-types.ts
│   │
│   └── modules/sales/*.ts   # resolver/service/repository/import/ingestion logic

front/
├── src/
│   ├── graphql/
│   ├── store/sales/types.ts
│   ├── lib/sales
│   ├── components/sales
│   ├── app/dashboard/sale/page.tsx
│   └── generated/graphql.tsx
└── queries/mutations and generated artifacts
```

## Phase 0: Research

### Research Outputs

- `research.md` resolves the data-removal approach and sequencing assumptions.
- Decision summary:
  - Remove `externalSaleId` from `Sale` as an exposed and stored field.
  - Remove `sourcePayload` from `Sale` and `Listing` persistence shapes.
  - Preserve operational functionality by continuing to keep existing mutable operational fields and relationship structure.
  - Keep Mongo ingestion mapping separate from the exposed/queried contract shape.
  - Front-end cleanup is deferred until backend contract and server-side behavior are stabilized.

### Dependencies & Best Practices Tasks

- Use existing schema-first GraphQL workflow for contract cleanup.
- Use one migration step to drop source-only columns, then follow code-path updates.
- Update type generation after backend contract edits.
- Coordinate migration safety checks against existing `sales` and `listings` tables before and after cleanup.

## Project Structure (this feature)

### Documentation

- [x] `plan.md`, `research.md`, `data-model.md`, `contracts/graphql-api.md`, `quickstart.md` prepared.

### Source Code

- [x] `back/schema.graphql`
- [x] `back/src/modules/sales/db/schema.ts`
- [x] `back/src/modules/sales/sales-schema.ts`
- [x] `back/src/modules/sales/sales.repository.ts`
- [x] `back/src/modules/sales/sales-import.service.ts`
- [x] `back/src/modules/sales/sales-ingestion.service.ts`
- [x] `back/src/modules/sales/sales.types.ts`
- [x] `front/src/store/sales/types.ts`
- [x] `front/src/graphql/queries/sales.graphql`
- [x] `front/src/graphql/mutations/sales.graphql`
- [x] `front/src/lib/sales/sales-utils.ts`
- [x] `front/src/components/sales/*` and `front/src/app/dashboard/sale/page.tsx`
- [x] `front/generated/graphql.tsx` (after running codegen)

## Complexity Tracking

No non-essential architecture complexity is introduced. Required sequencing is intentionally split to reduce coupling risk:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Backend first, frontend second | Prevents schema drift and stale UI references while contract is changing | Doing both simultaneously increases risk of unresolved contract breaks and test noise |
| Schema-first backend cleanup before UI cleanup | Maintains single source of truth contract behavior | Direct UI-only cleanup could compile against stale fields and miss unimplemented backend removals |
| Generated contract update instead of hand edits | Prevents TS API drift between back and front | Manual edits to generated types increase breakage risk |
