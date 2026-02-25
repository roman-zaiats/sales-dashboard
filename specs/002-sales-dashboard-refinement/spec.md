# Feature Specification: Sales Operations Dashboard Refinement

**Feature Branch**: `[002-sales-dashboard-refinement]`  
**Created**: `2026-02-25`  
**Status**: Draft  
**Input**: “Refine the existing sales dashboard by introducing a single Nest.js runtime, Drizzle ORM-based persistence, ShadCN UI components, draggable board status updates, and existing-tag multi-select suggestions.”

## Clarifications

### Session 2026-02-25

- Q: Should board status moves be constrained to a specific sequence (for example, only forward or backward in a fixed order)? → A: No. Cards may be moved to any of the four status columns.
- Q: Should board drag-and-drop status updates persist instantly or require a separate save action? → A: They must persist immediately and keep table/board in sync.
- Q: Should tag filtering allow both type-to-filter suggestions and manual tag entry? → A: Yes. Suggestions come from existing tags and users may also type entries.
- Q: When multiple tags are selected, should matches require all selected tags or any selected tag? → A: Any selected tag (OR semantics).
- Q: How should board drag-and-drop handle stale data races? → A: Reject stale moves, return card to source, and show a refresh-required warning.

## Glossary

- **Single-app runtime**: one Nest.js process provides API, GraphQL, and ingestion responsibilities.
- **Drizzle path**: sales, tags, users, comments, and ingestion metadata operations executed through Drizzle repository/service layers.
- **Refresh-required warning**: user-visible warning indicating a stale-write conflict requiring data refresh.
- **Drag move**: a sale card moving between two board columns, including same-column drag attempts.

## NFR and Execution Rules

- **Back-end phase gate**: `cd back && npm run build` and `cd back && npm run test`. and eslint check also 
- **Front-end phase gate**: `cd front && npm run typecheck` and `cd front && npm run build`. and eslint check also

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operate with a single application runtime

A user expects the dashboard to run as one unified app process for API, GraphQL, and ingestion behavior so operations are easier to manage.

**Independent Test**: In a runtime test or deployment checklist, verify there are no leader/worker modes required to provide full functionality.

**Acceptance Scenarios**:

1. **Given** the service is started in normal mode, **When** users access Sales, board, delayed, and detail views, **Then** all features work without a separate worker process.
2. **Given** ingestion is active, **When** operational edits are made in the dashboard, **Then** the same app process handles both ingestion and mutation/query behavior.

### User Story 2 - Update status with board drag-and-drop

An operations user reorganizes work by dragging cards between status columns.

**Independent Test**: Move one card to a different board column and verify status change appears in both board and table immediately.

**Acceptance Scenarios**:

1. **Given** a sale card is in one status column, **When** the user drops it into another column, **Then** the sale status is updated to the target column’s status.
2. **Given** multiple board users open views, **When** a status move is saved, **Then** changed status is visible in both board and table on refresh.
3. **Given** persistence of the move fails, **When** the request errors, **Then** the card returns to its source column and an explicit retry/error action is shown.

### User Story 3 - Use existing tags in filtering with flexible entry

An operations user filters by existing tags quickly without recalling exact IDs.

**Independent Test**: Open the tag filter selector, add two existing tags and one typed tag, and verify the filtering behavior remains correct.

**Acceptance Scenarios**:

1. **Given** the tag selector is focused, **When** no characters are entered, **Then** existing tags are shown as suggestions.
2. **Given** the user types partial input, **When** suggestions are filtered, **Then** only matching tags are offered for quick selection.
3. **Given** the user selects multiple tags and saves the filter, **Then** results match all selected tags.
4. **Given** the user selects multiple tags and saves the filter, **Then** results match at least one selected tag.
5. **Given** the user enters a new tag value not in suggestions, **When** the form is submitted, **Then** the typed value is accepted for filtering.

### User Story 4 - Keep UI in ShadCN pattern and consistent shell

An operations user receives a consistent product surface with reusable design primitives.

**Independent Test**: Inspect key dashboard screens and verify dashboard shell, board cards, filters, and detail actions use the shared component pattern.

**Acceptance Scenarios**:

1. **Given** the application is opened, **When** users navigate between Sales, Delayed, and Sale Details, **Then** layout and controls are implemented with project standard components.
2. **Given** users switch between table and board views, **When** filters and actions are used, **Then** UI behavior remains consistent across both views.

### User Story 5 - Keep persistence on ORM path

A team relies on consistent data handling and easier evolution for all sales persistence operations.

**Independent Test**: Review data access behavior and verify query/update operations are routed through the ORM path for sales and related entities.

**Acceptance Scenarios**:

1. **Given** a sale and related entities exist, **When** list, detail, and update actions are executed, **Then** the ORM path is used across repository/service flows.
2. **Given** ingestion updates arrive, **When** records upsert, **Then** operational fields and source-merge behavior remain intact.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST run all API, GraphQL, and ingestion responsibilities from one Nest.js application runtime.
- **FR-002**: System MUST preserve operational edits while ingesting updates from source data.
- **FR-003**: System MUST use Drizzle ORM for ORM-style persistence operations for sales, tags, users, comments, and ingestion metadata.
- **FR-004**: Board view MUST expose four status columns: Received, Completed, Delayed, Problem.
- **FR-005**: Card drag-and-drop MUST move a sale from one board column to another.
- **FR-006**: Drop-to-column MUST immediately trigger a status update.
- **FR-007**: Drag operations MUST be atomic in UI: failures return the card to its source column.
- **FR-007A**: Drag operations MUST detect stale updates (based on sale updated-at) and reject status moves that are out of date, returning the card to its source column with a refresh-required warning.
- **FR-007B**: Dragging a card to the same column must be treated as a no-op.
- **FR-008**: Tag filtering control MUST present existing tags for selection on focus/click.
- **FR-009**: Tag filtering control MUST support multi-select and typed free-form entries.
- **FR-010**: Tag filtering MUST support combined selection and typed terms using OR matching (at least one selected/typed tag).
- **FR-011**: Board, table/list, sale details, filters, and sidebar navigation MUST follow project-defined ShadCN component patterns.
- **FR-012**: The left sidebar MUST continue as the primary screen shell and be implemented with the same component standard.
- **FR-013**: Sales status updates initiated from drag-and-drop MUST remain reflected in list and detail views.
- **FR-014**: Board drag-and-drop updates MUST use the same stale-protection behavior as direct status edits to avoid overwriting newer changes.
- **FR-015**: Backend and frontend ESLint configuration baselines from the template project must be migrated before implementation starts.
- **FR-016**: Drag-and-drop and tag-filter UIs MUST support graceful empty/error states while preserving manual entry and recovery actions.

### Key Entities

- **Sale**: A persisted operational record with source and dashboard-editable state.
- **Tag**: Reusable label entity used for filtering and organizing sales.
- **Ingestion Run Metadata**: Sync state and run tracking used by periodic source updates.
- **User**: Internal operator account used for assignment and ownership.

### Assumptions

- The team uses a shared internal authenticated user set.
- Source records include a stable unique identifier for each sale.
- Tag suggestions are sourced from tags already stored in the system.
- Single-process runtime and ORM migration are accepted as a scoped technical refactor over incremental rollout.
- PostgreSQL and MongoDB are available in all environments where this feature is executed.
- Tag names are trimmed and deduplicated for matching and storage.
- Accessibility baseline for newly touched screens includes focus-visible and screen-reader semantics.
- Legacy leader/worker launch patterns are no longer part of operational operation after this refinement.

## Success Criteria *(mandatory)*

- **SC-001**: 95% of status updates made via board drag-and-drop are persisted within 3 seconds.
- **SC-002**: 99% of failed drag operations return the card to the original column without losing user changes.
- **SC-003**: 100% of new tag-filter interactions expose at least 3 suggestions on first open in normal catalogs.
- **SC-004**: All core UI surfaces in sales list, board, delayed list, filters, and sale details use ShadCN component patterns.
- **SC-005**: 100% of runtime operation modes run under a single Nest.js process.
- **SC-006**: 100% of relevant persistence operations for sales and tags are routed through Drizzle ORM-backed access paths.

### Edge and Failure Scenarios

- **ES-001**: If a drag mutation fails, the card must remain or return to source and expose retry/error action.
- **ES-002**: If tag suggestions return empty on open, the filter UI still allows manual entry and displays empty-state guidance.
- **ES-003**: If tag suggestions request fails, show an error state and keep manual input enabled.
