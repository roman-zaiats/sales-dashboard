export const salesSchemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_sale_id TEXT NOT NULL UNIQUE,
  source_payload JSONB,
  buyer_email TEXT,
  status TEXT NOT NULL,
  delivery_delay_at TIMESTAMPTZ,
  problem_reason TEXT,
  filled_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_sync_state TEXT
);

ALTER TABLE "sales" DROP COLUMN IF EXISTS listing_id;
ALTER TABLE "sales" DROP COLUMN IF EXISTS event_id;
ALTER TABLE "sales" DROP COLUMN IF EXISTS quantity;
ALTER TABLE "sales" DROP COLUMN IF EXISTS price;
ALTER TABLE "sales" DROP COLUMN IF EXISTS currency;

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE UNIQUE,
  source_listing_id TEXT NOT NULL UNIQUE,
  listing_id TEXT,
  advice_index INTEGER,
  area TEXT,
  assigned_pos TEXT,
  creation_date TIMESTAMPTZ,
  creation_type TEXT,
  event_id TEXT,
  event_name TEXT,
  exchange TEXT,
  exchanges_for_sale TEXT[],
  extra_fee NUMERIC,
  face_value NUMERIC,
  last_pos_modification_date TIMESTAMPTZ,
  lower_price NUMERIC,
  offer_id TEXT,
  original_section TEXT,
  places_ids TEXT[],
  price NUMERIC,
  price_multiplier NUMERIC,
  pricing_rule_multiplier_change_time TIMESTAMPTZ,
  quality NUMERIC,
  quantity INTEGER,
  row TEXT,
  rule_price_multiplier_index INTEGER,
  section TEXT,
  split_rule TEXT,
  start_row TEXT,
  status TEXT,
  status_change_date TIMESTAMPTZ,
  sub_platform TEXT,
  tags TEXT[],
  ticket_type_name TEXT,
  venue_name TEXT,
  fees JSONB,
  source_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_tags (
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (sale_id, tag_id)
);

CREATE TABLE IF NOT EXISTS sale_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  auth_sub TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingestion_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  processed_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
