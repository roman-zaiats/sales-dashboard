# Feature Specification: Remove Sale Source Fields from Dashboard Data Model

**Feature Branch**: `[003-remove-sale-source-fields]`  
**Created**: `2026-02-26`  
**Status**: Draft  
**Input**: "Create a spec only to remove unused sales fields `salesExternalSaleId` and `sourcePayload`; first remove from Postgres/schema, then backend, then frontend in a separate phase after pulling latest frontend changes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clean Data Model Before UI Changes (Priority: P1)

An operations user expects sales and listing records to stop carrying duplicate source-identifying and raw source payload fields that are no longer needed.

**Why this priority**: This removes the source of truth debt first and reduces risk before any API/UI changes.

**Independent Test**: Execute the backend data/API phase and verify sales records remain queryable while `externalSaleId` and `sourcePayload` no longer appear in sale/listing payloads.

**Acceptance Scenarios**:

1. **Given** existing sales rows exist with values in the legacy fields, **When** those records are read through the sale detail/list views, **Then** the dashboard still returns status, timing, owner, `dashboardTags`, and price fields without requiring those legacy fields.
2. **Given** the removal migration is applied to Postgres, **When** a sale list API call is made, **Then** the API response schema for each sale no longer includes `externalSaleId` or `sourcePayload`.

### User Story 2 - Keep Operations Functions Intact (Priority: P1)

An operator updates statuses, delays, owners, and comments and expects all existing workflows to continue with no regression from the field removals.

**Why this priority**: These are core dashboard operations and must stay stable during structural data cleanup.

**Independent Test**: Run the existing operational edit flows after backend contract change and confirm each flow succeeds.

**Acceptance Scenarios**:

1. **Given** a sale has a valid status, delay, problem, and `dashboardTags` state, **When** an operator updates any operational field, **Then** the mutation succeeds and all other fields remain correct.
2. **Given** listing details are shown with filters and `dashboardTags`, **When** a list refresh runs after field removal, **Then** results and filtering behavior are unchanged from baseline except that source fields are omitted.

### User Story 3 - Frontend Update After Upstream Sync (Priority: P2)

A front-end engineer uses the latest frontend branch before removing UI references, so the UI changes are applied to the current shape of the app.

**Why this priority**: This prevents rebase churn and keeps the later frontend pass aligned with current queries and components.

**Independent Test**: Perform frontend update work only after pulling latest frontend changes, then verify no references to removed fields remain.

**Acceptance Scenarios**:

1. **Given** backend contract changes are complete, **When** latest frontend changes are pulled and the frontend spec phase starts, **Then** the codebase includes only the updated GraphQL/typed contracts and no source fields are rendered.
2. **Given** sale list/detail pages are loaded, **When** the updated frontend is used, **Then** there are no compile or runtime errors caused by removed field usage.

### Edge Cases

- What happens to historical records already ingested with legacy field values?
- What happens if an external consumer or internal test query still requests the removed fields?
- What happens if ingestion writes legacy payload structure while backend cleanup is in progress?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Postgres data model must remove `externalSaleId` from persisted sale data where that field is no longer business-required.
- **FR-002**: The Postgres data model must remove `sourcePayload` from persisted sale/listing-related source data where it is no longer business-required.
- **FR-003**: Existing records must remain accessible after migration, with no functional regression to required operational fields (status, delay, problem, `dashboardTags`, comments, owner, and timestamps).
- **FR-004**: The GraphQL contract in `back/schema.graphql` must be updated so those fields are not part of the canonical sale/listing API shape.
- **FR-005**: Backend queries, list/detail responses, and mutation responses must align to the updated contract and must not expose `externalSaleId` or `sourcePayload`.
- **FR-006**: Ingestion and upsert behavior must continue to function without storing or returning `externalSaleId` and `sourcePayload`.
- **FR-007**: Migration readiness must include a documented impact note for any consumer that still queries removed fields.
- **FR-008**: Backend implementation and contract cleanup must be completed before frontend schema/query/render changes begin.
- **FR-009**: The frontend phase must explicitly start after pulling the latest frontend changes and then remove all UI dependencies on `externalSaleId` and `sourcePayload` in list/detail views, documents, and types.
- **FR-010**: The frontend phase must verify no user-visible output shows the removed fields.

### Key Entities *(include if feature involves data)*

- **Sale**: Operational sales record used by dashboard list/detail workflows.
- **Listing**: Event listing data associated with a sale.
- **Dashboard GraphQL Payload**: The shared contract shape consumed by backend and frontend.

### Assumptions

- The field referenced by the request as "sales External cell ID" is represented in the current system as `externalSaleId`.
- `sourcePayload` appears in both sale/listing exposure paths that must both be cleaned up.
- Frontend work is intentionally separate and should not be mixed with backend cleanup in this phase.
- Existing clients consuming these fields will be updated as part of the coordinated rollout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of backend sale/listing read payloads for active sales operations omit `externalSaleId` and `sourcePayload` after backend schema+contract updates.
- **SC-002**: 100% of existing sale workflows (view, filter, sort, status update, delay/problem edit, `dashboardTags` operations, comments) remain functional after removal, with no data loss in required operational fields.
- **SC-003**: At least one database verification pass confirms no active sale/listing rows still rely on the removed field values for operational logic.
- **SC-004**: Frontend phase starts only after latest frontend revision is pulled and ends with zero UI references to `externalSaleId` or `sourcePayload`.
- **SC-005**: No external consumer-facing document or developer onboarding docs rely on removed fields without a noted migration notice.
