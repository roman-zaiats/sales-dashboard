const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const scriptDir = __dirname;
const envPath = path.join(scriptDir, '.env');

const envPayload = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
for (const line of envPayload.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
    continue;
  }
  const index = trimmed.indexOf('=');
  const key = trimmed.slice(0, index);
  const value = trimmed.slice(index + 1);
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const connectionString = process.env.POSTGRES_URL || process.env.SALES_DATABASE_URL;
if (!connectionString) {
  console.error('Missing POSTGRES_URL or SALES_DATABASE_URL in env.');
  process.exit(1);
}

const useSsl = /[?&]sslmode=require/i.test(connectionString);

const salesFixture = [
  {
    externalSaleId: 'SL-1001',
    listingId: 'LV-220',
    eventId: '1C005453A3AF4F57',
    quantity: 2,
    price: 157,
    currency: 'USD',
    buyerEmail: 'alex.garcia@example.com',
    status: 'RECEIVED',
    deliveryDelayAt: null,
    problemReason: null,
    sourceCreatedAt: '2018-10-02T04:58:44.620Z',
    sourceUpdatedAt: '2018-10-02T04:58:44.620Z',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
    tags: ['vip', 'priority'],
    sourcePayload: {
      _id: { $oid: '5b17f2ffd3de21b8d330d418' },
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108226,
      section: '220',
      startRow: 'G',
      row: 'J',
      quantity: 3,
      lowerPrice: 157,
      price: 223,
      status: 'SOLD',
      creationType: 'PRICE_BREAKER',
      creationDate: { $date: '2018-10-02T04:58:44.620Z' },
      statusChangeDate: { $date: '2018-10-02T04:58:44.620Z' },
      eventId: '1C005453A3AF4F57',
      eventName: 'Metallica - WorldWired Tour',
      venueName: 'Save Mart Center',
      exchange: 'tm',
    },
  },
  {
    externalSaleId: 'SL-1002',
    listingId: 'LV-221',
    eventId: '1C005453A3AF4F58',
    quantity: 4,
    price: 89,
    currency: 'USD',
    buyerEmail: 'maria.choi@example.com',
    status: 'COMPLETED',
    deliveryDelayAt: null,
    problemReason: null,
    sourceCreatedAt: '2026-02-12T08:14:22.120Z',
    sourceUpdatedAt: '2026-02-12T08:14:22.120Z',
    createdAt: '2026-02-12T08:15:00.000Z',
    updatedAt: '2026-02-13T11:20:00.000Z',
    tags: ['clear', 'online-sale'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108227,
      section: '101',
      row: 'B',
      quantity: 4,
      lowerPrice: 55,
      price: 89,
      status: 'ALLOCATED',
      eventName: 'Jazz Night Downtown',
    },
  },
  {
    externalSaleId: 'SL-1003',
    listingId: 'LV-222',
    eventId: '1C005453A3AF4F59',
    quantity: 1,
    price: 420,
    currency: 'USD',
    buyerEmail: 'rachel.sims@example.com',
    status: 'DELAYED',
    deliveryDelayAt: '2026-02-24T09:00:00.000Z',
    problemReason: null,
    sourceCreatedAt: '2026-02-14T19:10:00.000Z',
    sourceUpdatedAt: '2026-02-14T19:12:00.000Z',
    createdAt: '2026-02-14T19:10:00.000Z',
    updatedAt: '2026-02-15T16:32:00.000Z',
    tags: ['hold', 'vip'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108228,
      section: '320',
      row: 'AA',
      quantity: 1,
      lowerPrice: 395,
      price: 420,
      status: 'BLOCKED',
      eventName: 'City Lights Orchestra',
    },
  },
  {
    externalSaleId: 'SL-1004',
    listingId: 'LV-223',
    eventId: '1C005453A3AF4F60',
    quantity: 6,
    price: 64,
    currency: 'USD',
    buyerEmail: 'samuel.hill@example.com',
    status: 'PROBLEM',
    deliveryDelayAt: '2026-02-20T11:30:00.000Z',
    problemReason: 'Buyer email mismatch in source feed',
    sourceCreatedAt: '2026-02-15T02:11:00.000Z',
    sourceUpdatedAt: '2026-02-17T04:20:00.000Z',
    createdAt: '2026-02-15T02:11:00.000Z',
    updatedAt: '2026-02-17T04:21:00.000Z',
    tags: ['problem', 'escalation'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108229,
      section: '008',
      row: 'F',
      quantity: 6,
      lowerPrice: 32,
      price: 64,
      status: 'SUSPENDED',
      eventName: 'Indie Open Air',
    },
  },
  {
    externalSaleId: 'SL-1005',
    listingId: 'LV-224',
    eventId: '1C005453A3AF4F61',
    quantity: 2,
    price: 299,
    currency: 'USD',
    buyerEmail: 'jordan.williams@example.com',
    status: 'DELAYED',
    deliveryDelayAt: '2026-02-01T15:00:00.000Z',
    problemReason: null,
    sourceCreatedAt: '2026-02-16T12:22:00.000Z',
    sourceUpdatedAt: '2026-02-16T14:01:00.000Z',
    createdAt: '2026-02-16T12:22:00.000Z',
    updatedAt: '2026-02-16T14:01:00.000Z',
    tags: ['late', 'hold'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108230,
      section: '012',
      row: 'M',
      quantity: 2,
      lowerPrice: 180,
      price: 299,
      status: 'HOLD',
      eventName: 'The Midnight Circuit',
    },
  },
  {
    externalSaleId: 'SL-1006',
    listingId: 'LV-225',
    eventId: '1C005453A3AF4F62',
    quantity: 10,
    price: 40,
    currency: 'USD',
    buyerEmail: 'lena.ortiz@example.com',
    status: 'RECEIVED',
    deliveryDelayAt: null,
    problemReason: null,
    sourceCreatedAt: '2026-02-17T10:50:00.000Z',
    sourceUpdatedAt: '2026-02-17T10:50:00.000Z',
    createdAt: '2026-02-17T10:50:00.000Z',
    updatedAt: '2026-02-17T10:50:00.000Z',
    tags: ['bulk', 'partner'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108231,
      section: '301',
      row: 'Q',
      quantity: 10,
      lowerPrice: 25,
      price: 40,
      status: 'PENDING',
      eventName: 'Arena Summer Showcase',
    },
  },
  {
    externalSaleId: 'SL-1007',
    listingId: 'LV-226',
    eventId: '1C005453A3AF4F63',
    quantity: 3,
    price: 180,
    currency: 'USD',
    buyerEmail: 'tom.brown@example.com',
    status: 'COMPLETED',
    deliveryDelayAt: null,
    problemReason: null,
    sourceCreatedAt: '2026-02-18T16:30:00.000Z',
    sourceUpdatedAt: '2026-02-18T16:30:00.000Z',
    createdAt: '2026-02-18T16:30:00.000Z',
    updatedAt: '2026-02-18T18:01:00.000Z',
    tags: ['online-sale'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108232,
      section: '110',
      row: 'C',
      quantity: 3,
      lowerPrice: 120,
      price: 180,
      status: 'FULFILLED',
      eventName: 'Electro Pulse Fest',
    },
  },
  {
    externalSaleId: 'SL-1008',
    listingId: 'LV-227',
    eventId: '1C005453A3AF4F64',
    quantity: 1,
    price: 600,
    currency: 'USD',
    buyerEmail: 'ivy.ku@example.com',
    status: 'PROBLEM',
    deliveryDelayAt: null,
    problemReason: 'Seat assignment conflict with existing order',
    sourceCreatedAt: '2026-02-19T13:33:00.000Z',
    sourceUpdatedAt: '2026-02-20T09:12:00.000Z',
    createdAt: '2026-02-19T13:33:00.000Z',
    updatedAt: '2026-02-20T09:13:00.000Z',
    tags: ['vip', 'problem'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108233,
      section: 'VIP',
      row: 'A',
      quantity: 1,
      lowerPrice: 450,
      price: 600,
      status: 'CONFLICT',
      eventName: 'Broadway Premiere',
    },
  },
  {
    externalSaleId: 'SL-1009',
    listingId: 'LV-228',
    eventId: '1C005453A3AF4F65',
    quantity: 8,
    price: 75,
    currency: 'USD',
    buyerEmail: 'casey.khan@example.com',
    status: 'DELAYED',
    deliveryDelayAt: '2026-01-30T10:00:00.000Z',
    problemReason: null,
    sourceCreatedAt: '2026-02-20T14:45:00.000Z',
    sourceUpdatedAt: '2026-02-20T14:45:00.000Z',
    createdAt: '2026-02-20T14:45:00.000Z',
    updatedAt: '2026-02-20T14:45:00.000Z',
    tags: ['late'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108234,
      section: '150',
      row: 'H',
      quantity: 8,
      lowerPrice: 45,
      price: 75,
      status: 'QUEUED',
      eventName: 'Regional Theater Gala',
    },
  },
  {
    externalSaleId: 'SL-1010',
    listingId: 'LV-229',
    eventId: '1C005453A3AF4F66',
    quantity: 2,
    price: 150,
    currency: 'USD',
    buyerEmail: 'dana.lee@example.com',
    status: 'RECEIVED',
    deliveryDelayAt: null,
    problemReason: null,
    sourceCreatedAt: '2026-02-21T09:12:00.000Z',
    sourceUpdatedAt: '2026-02-21T09:12:00.000Z',
    createdAt: '2026-02-21T09:12:00.000Z',
    updatedAt: '2026-02-21T09:12:00.000Z',
    tags: ['clear', 'partner'],
    sourcePayload: {
      _class: 'com.ia.tickets.consignment.model.ConsignmentListing',
      ticketGroupId: 108235,
      section: '204',
      row: 'P',
      quantity: 2,
      lowerPrice: 100,
      price: 150,
      status: 'NEW',
      eventName: 'City Festival Day 1',
    },
  },
];

const salesSchemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_sale_id TEXT NOT NULL UNIQUE,
  source_payload JSONB,
  listing_id TEXT,
  event_id TEXT,
  quantity INTEGER,
  price NUMERIC,
  currency TEXT,
  buyer_email TEXT,
  status TEXT NOT NULL,
  delivery_delay_at TIMESTAMPTZ,
  problem_reason TEXT,
  filled_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_created_at TIMESTAMPTZ,
  source_updated_at TIMESTAMPTZ,
  source_sync_state TEXT
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

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  auth_sub TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function upsertTags(client) {
  const tagNames = Array.from(
    new Set(salesFixture.flatMap(item => item.tags ?? [])),
  );

  if (tagNames.length === 0) {
    return;
  }

  for (const tagName of tagNames) {
    await client.query(
      `
      INSERT INTO tags (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      `,
      [tagName],
    );
  }
}

async function seed() {
  const client = new Client({
    connectionString,
    ssl: useSsl
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  });

  await client.connect();
  try {
    await client.query('BEGIN');

    await client.query(salesSchemaSql);
    await upsertTags(client);

    const user = await client.query(
      `
      INSERT INTO users (id, auth_sub, first_name, last_name)
      VALUES (gen_random_uuid(), $1, $2, $3)
      ON CONFLICT (auth_sub)
      DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
      RETURNING id
      `,
      ['seed-owner', 'System', 'Operator'],
    );

    const seededBy = user.rows[0]?.id ?? null;

    for (const item of salesFixture) {
      const insertedSale = await client.query(
        `
        INSERT INTO sales (
          external_sale_id, listing_id, event_id, quantity, price, currency, buyer_email,
          status, delivery_delay_at, problem_reason, filled_by_user_id, source_payload,
          source_created_at, source_updated_at, created_at, updated_at, source_sync_state
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (external_sale_id)
        DO UPDATE SET
          listing_id = EXCLUDED.listing_id,
          event_id = EXCLUDED.event_id,
          quantity = EXCLUDED.quantity,
          price = EXCLUDED.price,
          currency = EXCLUDED.currency,
          buyer_email = EXCLUDED.buyer_email,
          status = EXCLUDED.status,
          delivery_delay_at = EXCLUDED.delivery_delay_at,
          problem_reason = EXCLUDED.problem_reason,
          filled_by_user_id = EXCLUDED.filled_by_user_id,
          source_payload = EXCLUDED.source_payload,
          source_created_at = EXCLUDED.source_created_at,
          source_updated_at = EXCLUDED.source_updated_at,
          updated_at = EXCLUDED.updated_at
        RETURNING id
        `,
        [
          item.externalSaleId,
          item.listingId,
          item.eventId,
          item.quantity,
          item.price,
          item.currency,
          item.buyerEmail,
          item.status,
          item.deliveryDelayAt,
          item.problemReason,
          seededBy,
          JSON.stringify({ raw: item.sourcePayload }),
          item.sourceCreatedAt,
          item.sourceUpdatedAt,
          item.createdAt,
          item.updatedAt,
          item.status === 'DELAYED' ? 'seed:delayed' : item.status === 'PROBLEM' ? 'seed:problem' : null,
        ],
      );

      const saleId = insertedSale.rows[0].id;

      await client.query(`DELETE FROM sale_tags WHERE sale_id = $1`, [saleId]);

      const tags = item.tags ?? [];
      for (const tag of tags) {
        await client.query(
          `
          INSERT INTO sale_tags (sale_id, tag_id)
          SELECT $1, id FROM tags WHERE name = $2
          ON CONFLICT DO NOTHING
          `,
          [saleId, tag],
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seed complete. Upserted sales:', salesFixture.length);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
