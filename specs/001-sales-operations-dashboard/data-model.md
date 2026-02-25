# Data Model: Sales Operations Dashboard

## Entity: Sale

- `id` (UUID, primary key)
- `external_sale_id` (text, unique, indexed) — source system identifier
- `source_payload` (jsonb, optional)
- `listing_id` (text, optional)
- `event_id` (text, optional)
- `quantity` (integer, optional)
- `price` (numeric, optional)
- `currency` (text, optional)
- `buyer_email` (text, optional)
- `status` (enum: RECEIVED | COMPLETED | DELAYED | PROBLEM)
- `delivery_delay_at` (timestamptz, nullable)
- `problem_reason` (text, nullable)
- `filled_by_user_id` (uuid, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `source_sync_state` (uuid/timestamp pointer to ingestion progress)

### Derived Rule

- `status`, `delivery_delay_at`, `problem_reason`, `filled_by_user_id` are editable.

## Entity: Tag

- `id` (UUID, primary key)
- `name` (text, unique)
- `created_at` (timestamp)

## Entity: SaleTag (junction)

- `sale_id` (UUID, FK → sale.id, cascade)
- `tag_id` (UUID, FK → tag.id)
- Primary key on (`sale_id`, `tag_id`)

## Entity: SaleComment

- `id` (UUID, primary key)
- `sale_id` (UUID, FK → sale.id)
- `author_user_id` (UUID, FK → users.id)
- `comment` (text)
- `created_at` (timestamp)

## Entity: User

- `id` (UUID, primary key)
- `auth_sub` (text, unique)
- `first_name` (text)
- `last_name` (text)
- `created_at` (timestamp)

## Entity: IngestionState

- `key` (text, primary key)
- `value` (text)
- `updated_at` (timestamp)

Common example key:
- `mongodb:last_processed_created_at`
- `mongodb:last_processed_id`

## Entity: IngestionLog

- `id` (UUID, primary key)
- `run_at` (timestamp)
- `started_at` (timestamp)
- `finished_at` (timestamp)
- `status` (text: running/success/failure)
- `processed_count` (int)
- `inserted_count` (int)
- `updated_count` (int)
- `error_message` (text, nullable)
- `created_at` (timestamp)

## State Transitions

- `status` transitions are free-form in this scope; front-end should allow explicit change events through distinct mutation paths.
- `delivery_delay_at` can be nullified or moved in future.
- Any state change updates `updated_at` and creates a comment only when comment mutation is called.

## Validation Rules

- `external_sale_id` required and globally unique.
- `delivery_delay_at` must be valid timestamp.
- `status` constrained to enum values.
- `problem_reason` is optional but limited to a non-empty string when provided.
- `tags` operations are idempotent (re-adding same tag is harmless).
- `comments` are append-only and immutable after creation.

## Relationships

- A `User` can fill many `Sales`.
- A `Sale` can have many `SaleComments`.
- A `Sale` can have many `Tags` via `SaleTag`.
- One `IngestionState` may represent cursor values shared across ingestion runs.
