# Contracts: Sales Operations Dashboard Refinement

## Scope

The GraphQL API remains schema-first via `back/schema.graphql` and is treated as the implementation contract. This document captures existing and required interfaces for phase 1 implementation.

## Existing contract surface (as baseline)

- `Query`
  - `salesList(filter, sort, pagination): SaleListPayload!`
  - `saleById(id: ID!): Sale`
  - `delayedSales(filter, sort, pagination): SaleListPayload!`
  - `listUsersForAssignment: [User!]!`
- `Mutation`
  - `updateSaleStatus(id: ID!, status: SaleStatus!, expected_updated_at: DateTime): Sale!`
  - `updateSaleDelay(id: ID!, delivery_delay_at: DateTime, expected_updated_at: DateTime): Sale!`
  - `updateSaleProblem(id: ID!, problem_reason: String, expected_updated_at: DateTime): Sale!`
  - `setSaleFilledBy(id: ID!, user_id: ID!): Sale!`
  - `addSaleTag(id: ID!, tag_name: String!): Sale!`
  - `removeSaleTag(id: ID!, tag_name: String!): Sale!`
  - `addSaleComment(id: ID!, comment: String!): SaleComment!`

## Refinement-required contract additions

### `Query.tags` (or equivalent) for board/filter suggestions

**Purpose:** list existing tags for search/select in filter UI and allow discoverability without hardcoding values.

- Suggested field: `tags(search: String, limit: Int = 100): [SaleTag!]!` *(name to be finalized during implementation design)*
- Behavior:
  - Returns all tags when `search` is empty.
  - Supports prefix/contains filtering when search text is provided.
  - Stable ordering deterministic (e.g., alpha ascending, then id).
  - Reuse existing `SaleTag` shape.

### `Mutation.updateSaleStatus`

Already exists and is required for drag-and-drop status changes.

- Implementation notes:
  - Continue using `expected_updated_at` for stale-write protection.
  - Return error on stale input (`409` or GraphQL error domain-specific payload).

### `SaleFilterInput.tagIds`

Keep field for dashboard filtering.

- Interpretation for refinement:
  - OR semantics across values (match if sale has **any** selected/typed tag).
  - Support multiple user-entered values, including values not present in suggestion list.

## Types impacted by this phase

- `Sale` (status transitions + tags, updatedAt handling)
- `SaleFilterInput` (`tagIds` semantics and typing behavior)
- `SaleTag` (new queryable source list contract)
- `SaleComment` / `SaleComment!` return paths

## Non-functional contract constraints

- All frontend GraphQL types remain generated via `front/npm run codegen:graphql`.
- No non-GraphQL public contract files introduced unless needed for runtime scripts.
