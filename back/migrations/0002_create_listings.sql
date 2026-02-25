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

ALTER TABLE sales DROP COLUMN IF EXISTS listing_id;
ALTER TABLE sales DROP COLUMN IF EXISTS event_id;
ALTER TABLE sales DROP COLUMN IF EXISTS quantity;
ALTER TABLE sales DROP COLUMN IF EXISTS price;
ALTER TABLE sales DROP COLUMN IF EXISTS currency;

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name IN ('listing_id', 'event_id', 'quantity', 'price')
  ) = 4 THEN
    EXECUTE $sql$
      INSERT INTO listings (
        sale_id,
        source_listing_id,
        listing_id,
        event_id,
        quantity,
        price,
        created_at,
        updated_at
      )
      SELECT
        s.id,
        s.external_sale_id,
        s.listing_id,
        s.event_id,
        s.quantity,
        s.price,
        NOW(),
        NOW()
      FROM sales AS s
      WHERE NOT EXISTS (
        SELECT 1
        FROM listings AS l
        WHERE l.sale_id = s.id
      )
        AND (s.listing_id IS NOT NULL OR s.event_id IS NOT NULL OR s.quantity IS NOT NULL OR s.price IS NOT NULL);
    $sql$;
  END IF;
END $$;
