# Research Notes: Remove Sale Source Fields

## Decision: Field removal boundary

- Decision: Remove `externalSaleId` from all contract and persistence outputs for `Sale`, and remove `sourcePayload` from both `Sale` and `Listing`.
- Rationale: The feature request explicitly removes both fields as no longer needed and avoids exposing source-only payload data in dashboard workflows.
- Alternatives considered:
  - Keep `externalSaleId` in persistence only and hide from API: rejected because requirement is removal from data model plus backend contract.
  - Keep `sourcePayload` but strip it before returning to UI: rejected because storage and interface cleanup is requested, not just display masking.

## Decision: Backend sequencing and migration safety

- Decision: Execute cleanup in one backend phase: schema migration, repository/query/DTO/type updates, then contract update and regeneration, then service behavior verification.
- Rationale: Keeps migration and behavior changes controlled and allows regression checks before dependent frontend edits.
- Alternatives considered:
  - Frontend-first changes with temporary contract aliases: rejected due mismatch risk and repeated rebase/merge churn.
  - Full API and frontend changes in same phase: rejected because request explicitly requires phased order.

## Decision: Source identifier handling after removal

- Decision: Preserve sales record identity through existing internal IDs and listing-level source identifiers where already present. Remove the explicit source identifier field from public sale shape.
- Rationale: The dashboard workflows already rely on internal IDs for mutation lookup; this avoids carrying legacy source keys beyond persistence boundaries.
- Alternatives considered:
  - Keep a hidden dual key alias: rejected because it does not satisfy the remove requirement and prolongs dependency cleanup.
  - Introduce a new synthetic external key: rejected as unnecessary for this scoped cleanup.

## Decision: Contract hygiene and frontend regeneration

- Decision: Treat `back/schema.graphql` as the authority and regenerate frontend GraphQL types from it after cleanup.
- Rationale: Consistency with existing repository constitution and existing GraphQL source-of-truth rule.
- Alternatives considered:
  - Manual type surgery in front-end artifacts: rejected due schema drift and type mismatch risk.
  - Skip generation and rely on existing types for transition window: rejected because requirement explicitly calls out contract changes and separate phase boundaries.

## Decision: Frontend phase dependency

- Decision: Frontend changes must start only after pulling latest frontend branch content and only after backend contract/logic readiness.
- Rationale: User requirement explicitly names this sequencing and avoids stale assumptions about current UI fields.
- Alternatives considered:
  - Frontend cleanup before backend finalization: rejected due high probability of incomplete removals.
  - Omit explicit pull step: rejected because it violates the requested rollout order.
