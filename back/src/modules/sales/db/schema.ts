import { relations, sql } from 'drizzle-orm';
import { integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalSaleId: text('external_sale_id').notNull().unique(),
  listingId: text('listing_id'),
  eventId: text('event_id'),
  quantity: integer('quantity'),
  price: numeric('price', { precision: 16, scale: 4 }),
  currency: text('currency'),
  buyerEmail: text('buyer_email'),
  sourcePayload: jsonb('source_payload').$type<Record<string, unknown> | null>(),
  status: text('status').notNull(),
  deliveryDelayAt: timestamp('delivery_delay_at', { withTimezone: true }),
  problemReason: text('problem_reason'),
  filledByUserId: uuid('filled_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  sourceCreatedAt: timestamp('source_created_at', { withTimezone: true }),
  sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
  sourceSyncState: text('source_sync_state'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const saleRelations = relations(sales, ({ many, one }) => ({
  saleTags: many(saleTags),
  comments: many(saleComments),
  filledBy: one(users, {
    fields: [sales.filledByUserId],
    references: [users.id],
  }),
}));

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  saleTags: many(saleTags),
}));

export const saleTags = pgTable(
  'sale_tags',
  {
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey({ columns: [table.saleId, table.tagId] }),
  }),
);

export const saleTagRelations = relations(saleTags, ({ one }) => ({
  sale: one(sales, {
    fields: [saleTags.saleId],
    references: [sales.id],
  }),
  tag: one(tags, {
    fields: [saleTags.tagId],
    references: [tags.id],
  }),
}));

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  authSub: text('auth_sub').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
  ownedSales: many(sales),
  comments: many(saleComments),
}));

export const saleComments = pgTable('sale_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id')
    .notNull()
    .references(() => sales.id, { onDelete: 'cascade' }),
  authorUserId: uuid('author_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const saleCommentRelations = relations(saleComments, ({ one }) => ({
  sale: one(sales, {
    fields: [saleComments.saleId],
    references: [sales.id],
  }),
  author: one(users, {
    fields: [saleComments.authorUserId],
    references: [users.id],
  }),
}));

export const ingestionState = pgTable('ingestion_state', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const saleIngestionRuns = pgTable('sale_ingestion_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runAt: timestamp('run_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').notNull(),
  processedCount: integer('processed_count').default(0).notNull(),
  insertedCount: integer('inserted_count').default(0).notNull(),
  updatedCount: integer('updated_count').default(0).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});
