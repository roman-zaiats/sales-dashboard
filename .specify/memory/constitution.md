# Sales Dashboard Constitution

## Core Principles

### I. Phase Verification Gate
Before marking any development phase complete, the project MUST run and pass the required verification pipeline: TypeScript build for back end, back-end tests, and front-end build (or equivalent typecheck plus build). The next phase cannot start until this phase passes.

This gate must be executed at the end of every phase using:

```sh
./scripts/phase-gate.sh
```

The phase is considered incomplete until `./scripts/phase-gate.sh` returns exit code 0.
After every run, if the gate reports failures, the agent must:
1. fix all reported failures
2. rerun the gate immediately
3. repeat until a clean pass is achieved

No phase may be closed on a partial pass, and no additional work or next phase may start before the gate passes.

### II. GraphQL Contract Ownership
`back/schema.graphql` is the source of truth for GraphQL contract definitions. Front-end TypeScript GraphQL types must always be regenerated from this schema via `front/npm run codegen:graphql` and should not be hand-edited.

### III. Unified Runtime Topology
The application runs as a single Node/Nest.js back-end process. Separate leader/worker runtime roles are not retained.

### IV. ORM Transition Discipline
Data-access logic for sales-related persistence should move from ad-hoc raw-query layers toward a consistent ORM-style data access approach, with migration steps tracked and tested per phase.

### V. ShadCN UI Standard
When adding or refactoring UI, components from the local `front/src/components/ui` primitives and patterns should be preferred. Layout and navigation should avoid the default browser styling patterns.

### VI. Sandbox-First Network Behavior
All development work is executed by Codex inside a sandboxed environment. If external network access fails for reasons outside the code (for example, DNS resolution failures), do not over-engineer fallbacks; pause the work and request human assistance to provide/repair network access.

When external dependency fetches, schema/doc lookups, or package resolution are blocked by sandbox network issues, the agent must:
1. Record the failed operation and error.
2. Escalate immediately to a human for temporary or permanent internet access.
3. Resume only after access is restored.

## Development Workflow

### Phase Quality Gate
Each phase must complete the phase verification pipeline in this order:

1. Back-end TypeScript verification: `npm run build` in `back/`
2. Back-end tests: `npm run test` in `back/`
3. Front-end type/build verification: `npm run typecheck` and `npm run build` in `front/`

Do not mark a phase as complete until this gate passes with exit code 0.
Phases that do not satisfy all items must be treated as failed and corrected before moving forward.

### Change Tracking
Constitution principles and repository defaults should be updated when architecture or validation gates change.

## Governance

- This constitution is authoritative for work scope and quality.
- Changes to governance must update the version and the phase checks.
- The standard for this phase-aware workstream is: verify and resolve each gate before continuing.

**Version**: 1.2.1 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-25
