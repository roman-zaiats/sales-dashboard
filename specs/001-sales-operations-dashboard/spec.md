# Feature Specification: Sales Operations Dashboard

**Feature Branch**: `[001-sales-operations-dashboard]`  
**Created**: `2026-02-24`  
**Status**: Draft  
**Input**: User description: “Build an internal tool to track all ticket sales, show operational status at a glance, triage delays/problems by updating specific editable fields, and ingest sales from MongoDB into Postgres.”

## Clarifications

### Session 2026-02-24

- Q: What is the access model for viewing/editing sales? → A: All authenticated users can view and edit all sales, tags, status, delays, comments, and assignments.
- Q: How should concurrent edits to the same sale be handled? → A: Use last-write-wins with a change warning shown when the sale data was updated since it was opened.
- Q: What UX behavior is required for empty/loading/error states? → A: Show explicit loading, empty-result, and error states; network failures include inline error text and manual retry.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monitor and triage incoming sales (Priority: P1)

An operations user opens the Sales page and sees all current sales in a single place with status, delay, problem, tags, and assigned owner so they can quickly identify what needs action.

**Why this priority**: This enables the core operational workflow: knowing what is happening and where to focus.

**Independent Test**: In a mixed sales list, open Sales page and verify table and board views both show the same underlying sales with up-to-date key fields.

**Acceptance Scenarios**:

1. **Given** there are active sales, **When** a user opens the Sales page, **Then** each sale appears with identifiers, created time, status, delay time, problem text (if any), tags, and assigned owner.
2. **Given** a user switches from Table View to Board View, **When** the view loads, **Then** each sale is visible under its current status column.

### User Story 2 - Focus on delayed sales first (Priority: P1)

A user opens the Delayed page to inspect the most urgent delayed work and act on the most critical items first.

**Why this priority**: Delays are the highest-urgency exception path and determine response speed.

**Independent Test**: Load only delayed sales and confirm sort and overdue highlighting is correct and visible.

**Acceptance Scenarios**:

1. **Given** sales have delay timestamps in different dates and times, **When** the user opens the Delayed page, **Then** sales with earlier `delivery_delay_at` are listed first.
2. **Given** a sale is past due, **When** it is shown on Delayed page, **Then** an overdue indicator appears.

### User Story 3 - Update only operational fields (Priority: P2)

A user opens an individual sale and updates status, delay, problem, tags, owner, or comments to keep work context current.

**Why this priority**: This is the primary way teams keep the dataset usable for execution and handoff.

**Independent Test**: Open a sale and edit one permitted field; verify only editable fields can change.

**Acceptance Scenarios**:

1. **Given** Sale Details is open, **When** user updates status or delay or problem, **Then** those values persist and appear in both list and board views.
2. **Given** read-only source fields are visible in details, **When** the user attempts to edit them, **Then** edits are blocked and values remain unchanged.

### User Story 4 - Collaborate with comments and ownership (Priority: P2)

A user assigns ownership and adds notes to create accountability and context for future team actions.

**Why this priority**: It improves handoff quality and reduces repeated communication.

**Independent Test**: Add a comment and assign an owner to a sale; ensure both are reflected immediately and retained.

**Acceptance Scenarios**:

1. **Given** a sale is selected, **When** a user adds a comment, **Then** the comment is saved and appears in the history section.
2. **Given** a sale has multiple tags, **When** a user removes one and adds another, **Then** the tag list updates and is reused in filtering.

### User Story 5 - Preserve edits through ingestion (Priority: P3)

A user relies on background sync while operational changes are being made, and team edits must remain intact.

**Why this priority**: Prevents data loss during normal background operations.

**Independent Test**: Make changes to operational fields and force a sync cycle; ensure source updates do not erase manual edits.

**Acceptance Scenarios**:

1. **Given** a sale has custom status and comments set by operations, **When** source sync refreshes the same sale, **Then** the operational values remain exactly as set.
2. **Given** a new sale appears in source, **When** the sync runs, **Then** it is added and immediately available in Sales and Delayed views.

### Edge Cases

- What if required source fields are missing or malformed in incoming records?
- What if two users update the same sale operational fields at the same time?
- What happens when a user is assigned who no longer exists in the internal directory?
- How is the system represented when no sales match active filters/search?
- How is a delay timestamp shown when intentionally cleared by the user?
- What is shown while sales, delayed list, and details are loading, and how do users recover from load failures?

### Error and Interaction Behavior

- Sales, delayed list, and details MUST show a loading indicator during fetch.
- Empty result states MUST clearly state that no matching items exist and offer a path to broaden filters.
- Load and mutation failures MUST show error messaging and manual retry action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to access Sales, Board, Delayed, and Sale Details screens.
- **FR-002**: System MUST display sales in a table with stable columns for identifiers, created time, status, delay time, problem reason, tags, and assigned user.
- **FR-003**: System MUST support board view with four status columns: Received, Completed, Delayed, Problem.
- **FR-004**: System MUST support switching between table and board views from the Sales page.
- **FR-005**: System MUST support filtering by status, selected tags, delay presence, overdue-only, and text search.
- **FR-006**: System MUST provide a Delayed page that includes sales where delay exists.
- **FR-007**: System MUST sort Delayed view by earliest `delivery_delay_at` first.
- **FR-008**: System MUST visibly mark overdue items when delay timestamp is in the past.
- **FR-009**: System MUST show source-sale details in read-only mode in detail view.
- **FR-010**: System MUST allow updating `status` via a controlled set of values.
- **FR-011**: System MUST allow updating `delivery_delay_at`.
- **FR-012**: System MUST allow updating free-text `problem_reason`.
- **FR-013**: System MUST allow assigning `filled_by_user_id`.
- **FR-014**: System MUST allow adding and removing tags on a sale.
- **FR-015**: System MUST allow adding comments to a sale and keep them in append-only order.
- **FR-016**: System MUST preserve all configured editable fields across repeated source syncs.
- **FR-017**: System MUST never overwrite protected source fields from source updates.
- **FR-018**: System MUST import new/updated source records every 3 minutes and upsert them by external ID.
- **FR-019**: System MUST keep a sync cursor/state so incremental sync can continue safely.
- **FR-020**: System MUST show the authenticated user and provide sign-out.
- **FR-021**: System MUST allow all authenticated users to edit all sales records and all editable operational fields.
- **FR-022**: System MUST preserve edits using last-write-wins and notify users when an edit was made from stale data before saving.
- **FR-023**: System MUST display explicit loading, empty-result, and error/retry states for sales list, delayed list, and sale detail views.

### Key Entities *(include if feature involves data)*

- **Sale**: A row representing one imported sale with immutable source fields and editable operational fields.
- **Tag**: A label used for grouping and filtering sales.
- **Comment**: A timeline note attached to a sale.
- **Operational User**: Internal user with identity and ownership information.
- **Sync Cursor**: Stored progress marker used to resume periodic source sync.

### Assumptions

- The team has a single shared internal set of authenticated users for the dashboard.
- Authenticated identity is stable across sessions.
- Source records include a unique sale identifier available as external sale ID.
- Team workflow accepts eventual consistency for source sync while keeping operational edits authoritative.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of new sales appear in Delayed/ Sales views within 6 minutes of source changes.
- **SC-002**: 99% of sales edits made to allowed operational fields remain unchanged after at least one subsequent sync cycle.
- **SC-003**: Zero overwrite incidents for read-only source fields in manual edit flows during user acceptance.
- **SC-004**: 90% of users complete a status/delay/problem update flow in under 90 seconds.
- **SC-005**: 100% of users can distinguish overdue delayed sales without additional clicks.
- **SC-006**: Delayed page order places at least 98% of items correctly by urgency (earliest due first) during routine operation.
