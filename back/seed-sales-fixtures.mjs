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
    listingId: 'LV-220',
    eventId: '1C005453A3AF4F57',
    buyerEmail: 'alex.garcia@example.com',
    status: 'RECEIVED',
    deliveryDelayAt: null,
    problemReason: null,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
    tags: ['vip', 'priority'],
  },
  {
    listingId: 'LV-221',
    eventId: '1C005453A3AF4F58',
    buyerEmail: 'maria.choi@example.com',
    status: 'COMPLETED',
    deliveryDelayAt: null,
    problemReason: null,
    createdAt: '2026-02-12T08:15:00.000Z',
    updatedAt: '2026-02-13T11:20:00.000Z',
    tags: ['clear', 'online-sale'],
  },
  {
    listingId: 'LV-222',
    eventId: '1C005453A3AF4F59',
    buyerEmail: 'rachel.sims@example.com',
    status: 'DELAYED',
    deliveryDelayAt: '2026-02-24T09:00:00.000Z',
    problemReason: null,
    createdAt: '2026-02-14T19:10:00.000Z',
    updatedAt: '2026-02-15T16:32:00.000Z',
    tags: ['hold', 'vip'],
  },
  {
    listingId: 'LV-223',
    eventId: '1C005453A3AF4F60',
    buyerEmail: 'samuel.hill@example.com',
    status: 'PROBLEM',
    deliveryDelayAt: '2026-02-20T11:30:00.000Z',
    problemReason: 'Buyer email mismatch in source feed',
    createdAt: '2026-02-15T02:11:00.000Z',
    updatedAt: '2026-02-17T04:21:00.000Z',
    tags: ['problem', 'escalation'],
  },
  {
    listingId: 'LV-224',
    eventId: '1C005453A3AF4F61',
    buyerEmail: 'jordan.williams@example.com',
    status: 'DELAYED',
    deliveryDelayAt: '2026-02-01T15:00:00.000Z',
    problemReason: null,
    createdAt: '2026-02-16T12:22:00.000Z',
    updatedAt: '2026-02-16T14:01:00.000Z',
    tags: ['late', 'hold'],
  },
  {
    listingId: 'LV-225',
    eventId: '1C005453A3AF4F62',
    buyerEmail: 'lena.ortiz@example.com',
    status: 'RECEIVED',
    deliveryDelayAt: null,
    problemReason: null,
    createdAt: '2026-02-17T10:50:00.000Z',
    updatedAt: '2026-02-17T10:50:00.000Z',
    tags: ['bulk', 'partner'],
  },
  {
    listingId: 'LV-226',
    eventId: '1C005453A3AF4F63',
    buyerEmail: 'tom.brown@example.com',
    status: 'COMPLETED',
    deliveryDelayAt: null,
    problemReason: null,
    createdAt: '2026-02-18T16:30:00.000Z',
    updatedAt: '2026-02-18T18:01:00.000Z',
    tags: ['online-sale'],
  },
  {
    listingId: 'LV-227',
    eventId: '1C005453A3AF4F64',
    buyerEmail: 'ivy.ku@example.com',
    status: 'PROBLEM',
    deliveryDelayAt: null,
    problemReason: 'Seat assignment conflict with existing order',
    createdAt: '2026-02-19T13:33:00.000Z',
    updatedAt: '2026-02-20T09:13:00.000Z',
    tags: ['vip', 'problem'],
  },
  {
    listingId: 'LV-228',
    eventId: '1C005453A3AF4F65',
    buyerEmail: 'casey.khan@example.com',
    status: 'DELAYED',
    deliveryDelayAt: '2026-01-30T10:00:00.000Z',
    problemReason: null,
    createdAt: '2026-02-20T14:45:00.000Z',
    updatedAt: '2026-02-20T14:45:00.000Z',
    tags: ['late'],
  },
  {
    listingId: 'LV-229',
    eventId: '1C005453A3AF4F66',
    buyerEmail: 'dana.lee@example.com',
    status: 'RECEIVED',
    deliveryDelayAt: null,
    problemReason: null,
    createdAt: '2026-02-21T09:12:00.000Z',
    updatedAt: '2026-02-21T09:12:00.000Z',
    tags: ['clear', 'partner'],
  },
];

const salesSchemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_email TEXT,
  status TEXT NOT NULL,
  delivery_delay_at TIMESTAMPTZ,
  problem_reason TEXT,
  filled_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
          buyer_email,
          status, delivery_delay_at, problem_reason, filled_by_user_id,
          created_at, updated_at, source_sync_state
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING id
        `,
        [
          item.buyerEmail,
          item.status,
          item.deliveryDelayAt,
          item.problemReason,
          seededBy,
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
    console.log('Seed complete. Inserted sales:', salesFixture.length);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
