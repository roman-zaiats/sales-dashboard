import { relations, sql } from 'drizzle-orm';
import { integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalSaleId: text('external_sale_id').notNull().unique(),
  buyerEmail: text('buyer_email'),
  sourcePayload: jsonb('source_payload').$type<Record<string, unknown> | null>(),
  status: text('status').notNull(),
  deliveryDelayAt: timestamp('delivery_delay_at', { withTimezone: true }),
  problemReason: text('problem_reason'),
  filledByUserId: uuid('filled_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  sourceSyncState: text('source_sync_state'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id')
    .notNull()
    .unique()
    .references(() => sales.id, { onDelete: 'cascade' }),
  sourceListingId: text('source_listing_id').notNull().unique(),
  listingId: text('listing_id'),
  adviceIndex: integer('advice_index'),
  area: text('area'),
  assignedPos: text('assigned_pos'),
  creationDate: timestamp('creation_date', { withTimezone: true }),
  creationType: text('creation_type'),
  eventId: text('event_id'),
  eventName: text('event_name'),
  exchange: text('exchange'),
  exchangesForSale: text('exchanges_for_sale').array(),
  extraFee: numeric('extra_fee'),
  faceValue: numeric('face_value'),
  lastPosModificationDate: timestamp('last_pos_modification_date', { withTimezone: true }),
  lowerPrice: numeric('lower_price'),
  offerId: text('offer_id'),
  originalSection: text('original_section'),
  placesIds: text('places_ids').array(),
  price: numeric('price', { precision: 16, scale: 4 }),
  priceMultiplier: numeric('price_multiplier', { precision: 16, scale: 4 }),
  pricingRuleMultiplierChangeTime: timestamp('pricing_rule_multiplier_change_time', { withTimezone: true }),
  quality: numeric('quality'),
  quantity: integer('quantity'),
  row: text('row'),
  rulePriceMultiplierIndex: integer('rule_price_multiplier_index'),
  section: text('section'),
  splitRule: text('split_rule'),
  startRow: text('start_row'),
  status: text('status'),
  statusChangeDate: timestamp('status_change_date', { withTimezone: true }),
  subPlatform: text('sub_platform'),
  tags: text('tags').array(),
  ticketTypeName: text('ticket_type_name'),
  venueName: text('venue_name'),
  fees: jsonb('fees').$type<Array<{
    type?: string | null;
    description?: string | null;
    amount?: string | number | null;
  }> | null>(),
  sourcePayload: jsonb('source_payload').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`NOW()`)
    .notNull(),
});

export const listingRelations = relations(listings, ({ one }) => ({
  sale: one(sales, {
    fields: [listings.saleId],
    references: [sales.id],
  }),
}));

export const saleRelations = relations(sales, ({ many, one }) => ({
  listing: one(listings, {
    fields: [sales.id],
    references: [listings.saleId],
  }),
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
