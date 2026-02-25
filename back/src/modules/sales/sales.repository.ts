import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, lt, or, type SQL, sql } from 'drizzle-orm';

import { type SalesDatabaseContext } from './db/client';
import { ingestionState, listings, saleComments, saleIngestionRuns, sales, saleTags, tags, users } from './db/schema';
import {
  DashboardTag,
  type Listing,
  type ListingFee,
  type PaginationInput,
  type Sale,
  type SaleComment,
  type SaleFilterInput,
  type SaleListPayload,
  type SaleSortInput,
  type SaleSourceRecord,
  SaleStatus,
  type UserRecord,
} from './sales.types';
import { SALES_DB_CONTEXT } from './sales-db.module';
import { salesSchemaSql } from './sales-schema';

type SaleQueryRow = {
  sale: {
    id: string;
    externalSaleId: string;
    buyerEmail: string | null;
    status: string;
    deliveryDelayAt: string | Date | null;
    problemReason: string | null;
    filledByUserId: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    sourcePayload: Record<string, unknown> | null;
  };
  listing: {
    id: string | null;
    saleId: string | null;
    sourceListingId: string | null;
    listingId: string | null;
    adviceIndex: number | null;
    area: string | null;
    assignedPos: string | null;
    creationDate: string | Date | null;
    creationType: string | null;
    eventId: string | null;
    eventName: string | null;
    exchange: string | null;
    exchangesForSale: string[] | null;
    extraFee: string | number | null;
    faceValue: string | number | null;
    lastPosModificationDate: string | Date | null;
    lowerPrice: string | number | null;
    offerId: string | null;
    originalSection: string | null;
    placesIds: string[] | null;
    price: string | number | null;
    priceMultiplier: string | number | null;
    pricingRuleMultiplierChangeTime: string | Date | null;
    quality: string | number | null;
    quantity: number | null;
    row: string | null;
    rulePriceMultiplierIndex: number | null;
    section: string | null;
    splitRule: string | null;
    startRow: string | null;
    status: string | null;
    statusChangeDate: string | Date | null;
    subPlatform: string | null;
    ticketTypeName: string | null;
    venueName: string | null;
    tags: string[] | null;
    fees: ListingFee[] | null;
    sourcePayload: Record<string, unknown> | null;
    createdAt: string | Date | null;
    updatedAt: string | Date | null;
  } | null;
};

@Injectable()
export class SalesRepository {
  constructor(@Inject(SALES_DB_CONTEXT) private readonly database: SalesDatabaseContext) {}

  private get pool() {
    return this.database.pool;
  }

  private get db() {
    return this.database.db;
  }

  async initializeSchema(): Promise<void> {
    await this.pool.query(salesSchemaSql);
  }

  async listSales(
    filter: SaleFilterInput = {},
    sort?: SaleSortInput,
    pagination: PaginationInput = {},
  ): Promise<SaleListPayload> {
    await this.initializeSchema();

    const limit = Math.max(1, Math.min(pagination.limit ?? 50, 200));
    const offset = Math.max(0, pagination.skip ?? 0);
    const sortBy = this.normalizeSortField(sort?.field ?? 'updated_at');
    const order = sort?.direction === 'ASC' ? 'ASC' : 'DESC';
    const sortColumn = this.resolveSortColumn(sortBy);
    const where = this.buildWhereClause(filter);

    const [rows, totalRow] = await Promise.all([
      this.db
        .select({
          sale: {
            id: sales.id,
            externalSaleId: sales.externalSaleId,
            buyerEmail: sales.buyerEmail,
            status: sales.status,
            deliveryDelayAt: sales.deliveryDelayAt,
            problemReason: sales.problemReason,
            filledByUserId: sales.filledByUserId,
            createdAt: sales.createdAt,
            updatedAt: sales.updatedAt,
            sourcePayload: sales.sourcePayload,
          },
          listing: {
            id: listings.id,
            saleId: listings.saleId,
            sourceListingId: listings.sourceListingId,
            listingId: listings.listingId,
            adviceIndex: listings.adviceIndex,
            area: listings.area,
            assignedPos: listings.assignedPos,
            creationDate: listings.creationDate,
            creationType: listings.creationType,
            eventId: listings.eventId,
            eventName: listings.eventName,
            exchange: listings.exchange,
            exchangesForSale: listings.exchangesForSale,
            extraFee: listings.extraFee,
            faceValue: listings.faceValue,
            lastPosModificationDate: listings.lastPosModificationDate,
            lowerPrice: listings.lowerPrice,
            offerId: listings.offerId,
            originalSection: listings.originalSection,
            placesIds: listings.placesIds,
            price: listings.price,
            priceMultiplier: listings.priceMultiplier,
            pricingRuleMultiplierChangeTime: listings.pricingRuleMultiplierChangeTime,
            quality: listings.quality,
            quantity: listings.quantity,
            row: listings.row,
            rulePriceMultiplierIndex: listings.rulePriceMultiplierIndex,
            section: listings.section,
            splitRule: listings.splitRule,
            startRow: listings.startRow,
            status: listings.status,
            statusChangeDate: listings.statusChangeDate,
            subPlatform: listings.subPlatform,
            ticketTypeName: listings.ticketTypeName,
            venueName: listings.venueName,
            tags: listings.tags,
            fees: listings.fees,
            sourcePayload: listings.sourcePayload,
            createdAt: listings.createdAt,
            updatedAt: listings.updatedAt,
          },
        })
        .from(sales)
        .leftJoin(listings, eq(listings.saleId, sales.id))
        .where(where)
        .orderBy(order === 'ASC' ? asc(sortColumn) : desc(sortColumn), asc(sales.createdAt), asc(sales.id))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(sales).leftJoin(listings, eq(listings.saleId, sales.id)).where(where),
    ]);

    const saleIds = rows.map(row => row.sale.id);
    const [tagsBySaleId, commentsBySaleId, usersBySaleId] = await Promise.all([
      this.loadTagsForSales(saleIds),
      this.loadCommentsForSales(saleIds),
      this.loadUsersForSaleOwners(saleIds),
    ]);

    const total = totalRow[0]?.total ?? 0;

    return {
      items: rows.map(row =>
        this.mapRow(
          row,
          tagsBySaleId.get(row.sale.id) ?? [],
          commentsBySaleId.get(row.sale.id) ?? [],
          usersBySaleId.get(row.sale.id) ?? null,
        ),
      ),
      totalCount: Number(total),
    };
  }

  async listDelayedSales(
    filter: SaleFilterInput = {},
    sort?: SaleSortInput,
    pagination: PaginationInput = {},
  ): Promise<SaleListPayload> {
    return await this.listSales(
      {
        ...filter,
        has_delay: true,
      },
      {
        field: sort?.field ?? 'delivery_delay_at',
        direction: sort?.direction ?? 'ASC',
      },
      pagination,
    );
  }

  async updateStatus(id: string, status: SaleStatus, expectedUpdatedAt?: string | null): Promise<Sale | null> {
    return await this.updateSale(id, { status }, expectedUpdatedAt);
  }

  async updateDelay(
    id: string,
    deliveryDelayAt: string | null,
    expectedUpdatedAt?: string | null,
  ): Promise<Sale | null> {
    return await this.updateSale(id, { deliveryDelayAt }, expectedUpdatedAt);
  }

  async updateProblem(
    id: string,
    problemReason: string | null,
    expectedUpdatedAt?: string | null,
  ): Promise<Sale | null> {
    return await this.updateSale(id, { problemReason }, expectedUpdatedAt);
  }

  async setSaleFilledBy(id: string, userId: string): Promise<Sale | null> {
    await this.initializeSchema();

    const updateResult = await this.db
      .update(sales)
      .set({
        filledByUserId: userId,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id));

    if (updateResult.rowCount === 0) {
      return null;
    }

    return await this.findById(id);
  }

  async addSaleTag(id: string, tagName: string): Promise<Sale | null> {
    await this.initializeSchema();
    const normalizedTagName = tagName.trim();

    if (!normalizedTagName) {
      throw new Error('tag_name cannot be empty');
    }

    await this.db.transaction(async tx => {
      await tx.insert(tags).values({ name: normalizedTagName }).onConflictDoNothing();

      const [tagRow] = await tx
        .select({
          id: tags.id,
        })
        .from(tags)
        .where(eq(tags.name, normalizedTagName))
        .limit(1);

      if (!tagRow?.id) {
        throw new Error(`Tag could not be created: ${normalizedTagName}`);
      }

      const linked = await tx
        .insert(saleTags)
        .values({
          saleId: id,
          tagId: tagRow.id,
        })
        .onConflictDoNothing()
        .returning();

      if (linked.length > 0) {
        await tx.update(sales).set({ updatedAt: new Date() }).where(eq(sales.id, id));
      }
    });

    return await this.findById(id);
  }

  async removeSaleTag(id: string, tagName: string): Promise<Sale | null> {
    await this.initializeSchema();
    const normalizedTagName = tagName.trim();

    if (!normalizedTagName) {
      throw new Error('tag_name cannot be empty');
    }

    await this.db.transaction(async tx => {
      const [tagRow] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.name, normalizedTagName)).limit(1);

      if (!tagRow?.id) {
        return;
      }

      const removed = await tx.delete(saleTags).where(and(eq(saleTags.saleId, id), eq(saleTags.tagId, tagRow.id)));

      if (removed.rowCount && removed.rowCount > 0) {
        await tx.update(sales).set({ updatedAt: new Date() }).where(eq(sales.id, id));
      }
    });

    return await this.findById(id);
  }

  async addSaleComment(id: string, comment: string): Promise<SaleComment> {
    await this.initializeSchema();
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      throw new Error('Comment cannot be empty');
    }

    const authorUserId = await this.ensureCommentAuthorUserId();

    const [commentRow] = await this.db.transaction(async tx => {
      const inserted = await tx
        .insert(saleComments)
        .values({
          saleId: id,
          authorUserId,
          comment: trimmedComment,
        })
        .returning({
          id: saleComments.id,
          comment: saleComments.comment,
          createdAt: saleComments.createdAt,
          authorUserId: saleComments.authorUserId,
        });

      await tx.update(sales).set({ updatedAt: new Date() }).where(eq(sales.id, id));

      return inserted;
    });

    const authorName = await this.getUserFullName(authorUserId);

    return {
      id: commentRow.id,
      comment: commentRow.comment,
      createdAt: this.toDateString(commentRow.createdAt),
      author: authorName,
    };
  }

  async findById(id: string): Promise<Sale | null> {
    await this.initializeSchema();
    const [row] = await this.db
      .select({
        sale: {
          id: sales.id,
          externalSaleId: sales.externalSaleId,
          buyerEmail: sales.buyerEmail,
          status: sales.status,
          deliveryDelayAt: sales.deliveryDelayAt,
          problemReason: sales.problemReason,
          filledByUserId: sales.filledByUserId,
          createdAt: sales.createdAt,
          updatedAt: sales.updatedAt,
          sourcePayload: sales.sourcePayload,
        },
        listing: {
          id: listings.id,
          saleId: listings.saleId,
          sourceListingId: listings.sourceListingId,
          listingId: listings.listingId,
          adviceIndex: listings.adviceIndex,
          area: listings.area,
          assignedPos: listings.assignedPos,
          creationDate: listings.creationDate,
          creationType: listings.creationType,
          eventId: listings.eventId,
          eventName: listings.eventName,
          exchange: listings.exchange,
          exchangesForSale: listings.exchangesForSale,
          extraFee: listings.extraFee,
          faceValue: listings.faceValue,
          lastPosModificationDate: listings.lastPosModificationDate,
          lowerPrice: listings.lowerPrice,
          offerId: listings.offerId,
          originalSection: listings.originalSection,
          placesIds: listings.placesIds,
          price: listings.price,
          priceMultiplier: listings.priceMultiplier,
          pricingRuleMultiplierChangeTime: listings.pricingRuleMultiplierChangeTime,
          quality: listings.quality,
          quantity: listings.quantity,
          row: listings.row,
          rulePriceMultiplierIndex: listings.rulePriceMultiplierIndex,
          section: listings.section,
          splitRule: listings.splitRule,
          startRow: listings.startRow,
          status: listings.status,
          statusChangeDate: listings.statusChangeDate,
          subPlatform: listings.subPlatform,
          ticketTypeName: listings.ticketTypeName,
          venueName: listings.venueName,
          tags: listings.tags,
          fees: listings.fees,
          sourcePayload: listings.sourcePayload,
          createdAt: listings.createdAt,
          updatedAt: listings.updatedAt,
        },
      })
      .from(sales)
      .leftJoin(listings, eq(listings.saleId, sales.id))
      .where(eq(sales.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const [tagsBySaleId, commentsBySaleId, usersBySaleId] = await Promise.all([
      this.loadTagsForSales([row.sale.id]),
      this.loadCommentsForSales([row.sale.id]),
      this.loadUsersForSaleOwners([row.sale.id]),
    ]);

    return this.mapRow(
      row,
      tagsBySaleId.get(row.sale.id) ?? [],
      commentsBySaleId.get(row.sale.id) ?? [],
      usersBySaleId.get(row.sale.id) ?? null,
    );
  }

  async getIngestionCursor(key: string): Promise<string | null> {
    await this.initializeSchema();
    const [cursorRow] = await this.db
      .select({ value: ingestionState.value })
      .from(ingestionState)
      .where(eq(ingestionState.key, key))
      .limit(1);

    return cursorRow?.value ?? null;
  }

  async setIngestionCursor(key: string, value: string): Promise<void> {
    await this.initializeSchema();

    await this.db
      .insert(ingestionState)
      .values({
        key,
        value,
      })
      .onConflictDoUpdate({
        target: ingestionState.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      });
  }

  async startIngestionRun(): Promise<string> {
    await this.initializeSchema();
    const [run] = await this.db
      .insert(saleIngestionRuns)
      .values({
        status: 'running',
        startedAt: new Date(),
      })
      .returning({ id: saleIngestionRuns.id });

    if (!run?.id) {
      throw new Error('Failed to create ingestion run metadata');
    }

    return run.id;
  }

  async finishIngestionRunSuccess(
    runId: string,
    payload: {
      processedCount: number;
      insertedCount: number;
      updatedCount: number;
    },
  ): Promise<void> {
    await this.initializeSchema();

    await this.db
      .update(saleIngestionRuns)
      .set({
        status: 'success',
        finishedAt: new Date(),
        processedCount: payload.processedCount,
        insertedCount: payload.insertedCount,
        updatedCount: payload.updatedCount,
      })
      .where(eq(saleIngestionRuns.id, runId));
  }

  async finishIngestionRunFailure(runId: string, errorMessage: string): Promise<void> {
    await this.initializeSchema();

    await this.db
      .update(saleIngestionRuns)
      .set({
        status: 'failure',
        finishedAt: new Date(),
        errorMessage,
      })
      .where(eq(saleIngestionRuns.id, runId));
  }

  async upsertSalesFromSource(
    records: SaleSourceRecord[],
    sourceSyncState: string,
  ): Promise<{
    insertedCount: number;
    updatedCount: number;
    processedCount: number;
  }> {
    await this.initializeSchema();

    const uniqueRecords = Array.from(new Map(records.map(record => [record.externalSaleId, record])).values());

    if (uniqueRecords.length === 0) {
      return { insertedCount: 0, updatedCount: 0, processedCount: 0 };
    }

    const batchSize = 500;
    let insertedCount = 0;
    let updatedCount = 0;

    await this.db.transaction(async tx => {
      for (let i = 0; i < uniqueRecords.length; i += batchSize) {
        const batch = uniqueRecords.slice(i, i + batchSize);
        const batchExternalIds = batch.map(record => record.externalSaleId);
        const existingRows = await tx
          .select({ externalSaleId: sales.externalSaleId })
          .from(sales)
          .where(inArray(sales.externalSaleId, batchExternalIds));
        const batchExistingIds = new Set(existingRows.map(row => row.externalSaleId));

        insertedCount += batch.length - batchExistingIds.size;
        updatedCount += batchExistingIds.size;

        const upsertedSales = await tx
          .insert(sales)
          .values(
            batch.map(record => ({
              externalSaleId: record.externalSaleId,
              buyerEmail: record.buyerEmail,
              status: record.sourceStatus ?? SaleStatus.RECEIVED,
              createdAt: this.parseDateField(record.createdAt) ?? new Date(),
              updatedAt: this.parseDateField(record.updatedAt) ?? new Date(),
              sourcePayload: record.sourcePayload,
              sourceSyncState,
            })),
          )
          .onConflictDoUpdate({
            target: sales.externalSaleId,
            set: {
              buyerEmail: sql`EXCLUDED.buyer_email`,
              sourcePayload: sql`EXCLUDED.source_payload`,
              sourceSyncState: sql`EXCLUDED.source_sync_state`,
              status: sales.status,
              deliveryDelayAt: sales.deliveryDelayAt,
              problemReason: sales.problemReason,
              filledByUserId: sales.filledByUserId,
              updatedAt: new Date(),
            },
          })
          .returning({
            id: sales.id,
            externalSaleId: sales.externalSaleId,
          });

        const saleIdByExternal = new Map<string, string>(upsertedSales.map(row => [row.externalSaleId, row.id]));

        if (upsertedSales.length === 0) {
          continue;
        }

        await tx
          .insert(listings)
          .values(
            batch
              .map(record => {
                const saleId = saleIdByExternal.get(record.externalSaleId);

                if (!saleId) {
                  return null;
                }

                let listingCreatedAt = this.parseDateField(record.listing.creationDate);

                if (!listingCreatedAt) {
                  listingCreatedAt = this.parseDateField(record.createdAt);
                }

                if (!listingCreatedAt) {
                  listingCreatedAt = new Date();
                }

                const listingUpdatedAt =
                  this.parseDateField(record.listing.statusChangeDate) ??
                  this.parseDateField(record.updatedAt) ??
                  new Date();

                return {
                  saleId,
                  sourceListingId: record.listing.sourceListingId ?? record.externalSaleId,
                  listingId: record.listing.listingId,
                  adviceIndex: record.listing.adviceIndex,
                  area: record.listing.area,
                  assignedPos: record.listing.assignedPos,
                  creationDate: listingCreatedAt,
                  creationType: record.listing.creationType,
                  eventId: record.listing.eventId,
                  eventName: record.listing.eventName,
                  exchange: record.listing.exchange,
                  exchangesForSale: record.listing.exchangesForSale,
                  extraFee: this.parseDecimalForDb(record.listing.extraFee),
                  faceValue: this.parseDecimalForDb(record.listing.faceValue),
                  lastPosModificationDate: this.parseDateField(record.listing.lastPosModificationDate),
                  lowerPrice: this.parseDecimalForDb(record.listing.lowerPrice),
                  offerId: record.listing.offerId,
                  originalSection: record.listing.originalSection,
                  placesIds: record.listing.placesIds,
                  price: this.parseDecimalForDb(record.listing.price),
                  priceMultiplier: this.parseDecimalForDb(record.listing.priceMultiplier),
                  pricingRuleMultiplierChangeTime: this.parseDateField(record.listing.pricingRuleMultiplierChangeTime),
                  quality: this.parseDecimalForDb(record.listing.quality),
                  quantity: record.listing.quantity,
                  row: record.listing.row,
                  rulePriceMultiplierIndex: record.listing.rulePriceMultiplierIndex,
                  section: record.listing.section,
                  splitRule: record.listing.splitRule,
                  startRow: record.listing.startRow,
                  status: record.listing.status,
                  statusChangeDate: this.parseDateField(record.listing.statusChangeDate),
                  subPlatform: record.listing.subPlatform,
                  ticketTypeName: record.listing.ticketTypeName,
                  venueName: record.listing.venueName,
                  tags: record.listing.tags,
                  fees: record.listing.fees,
                  sourcePayload: record.listing.sourcePayload,
                  createdAt: listingCreatedAt,
                  updatedAt: listingUpdatedAt,
                };
              })
              .filter((row): row is NonNullable<typeof row> => Boolean(row)),
          )
          .onConflictDoUpdate({
            target: listings.sourceListingId,
            set: {
              saleId: sql`EXCLUDED.sale_id`,
              listingId: sql`EXCLUDED.listing_id`,
              adviceIndex: sql`EXCLUDED.advice_index`,
              area: sql`EXCLUDED.area`,
              assignedPos: sql`EXCLUDED.assigned_pos`,
              creationDate: sql`EXCLUDED.creation_date`,
              creationType: sql`EXCLUDED.creation_type`,
              eventId: sql`EXCLUDED.event_id`,
              eventName: sql`EXCLUDED.event_name`,
              exchange: sql`EXCLUDED.exchange`,
              exchangesForSale: sql`EXCLUDED.exchanges_for_sale`,
              extraFee: sql`EXCLUDED.extra_fee`,
              faceValue: sql`EXCLUDED.face_value`,
              lastPosModificationDate: sql`EXCLUDED.last_pos_modification_date`,
              lowerPrice: sql`EXCLUDED.lower_price`,
              offerId: sql`EXCLUDED.offer_id`,
              originalSection: sql`EXCLUDED.original_section`,
              placesIds: sql`EXCLUDED.places_ids`,
              price: sql`EXCLUDED.price`,
              priceMultiplier: sql`EXCLUDED.price_multiplier`,
              pricingRuleMultiplierChangeTime: sql`EXCLUDED.pricing_rule_multiplier_change_time`,
              quality: sql`EXCLUDED.quality`,
              quantity: sql`EXCLUDED.quantity`,
              row: sql`EXCLUDED.row`,
              rulePriceMultiplierIndex: sql`EXCLUDED.rule_price_multiplier_index`,
              section: sql`EXCLUDED.section`,
              splitRule: sql`EXCLUDED.split_rule`,
              startRow: sql`EXCLUDED.start_row`,
              status: sql`EXCLUDED.status`,
              statusChangeDate: sql`EXCLUDED.status_change_date`,
              subPlatform: sql`EXCLUDED.sub_platform`,
              ticketTypeName: sql`EXCLUDED.ticket_type_name`,
              venueName: sql`EXCLUDED.venue_name`,
              tags: sql`EXCLUDED.tags`,
              fees: sql`EXCLUDED.fees`,
              sourcePayload: sql`EXCLUDED.source_payload`,
              updatedAt: new Date(),
            },
          });
      }
    });

    return {
      processedCount: uniqueRecords.length,
      insertedCount,
      updatedCount,
    };
  }

  async countByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const [response] = await this.db.select({ total: count() }).from(sales).where(inArray(sales.id, ids));

    return Number(response.total ?? 0);
  }

  async listTags(search?: string, limit = 100): Promise<DashboardTag[]> {
    await this.initializeSchema();

    const maxLimit = Math.max(1, Math.min(Math.floor(Number(limit) || 0), 500));
    const safeLimit = Number.isNaN(maxLimit) || maxLimit < 1 ? 100 : maxLimit;
    const searchValue = search?.trim();
    const normalizedSearch = searchValue ? `%${searchValue}%` : undefined;

    const rows = normalizedSearch
      ? await this.db
          .select({
            id: tags.id,
            name: tags.name,
          })
          .from(tags)
          .where(sql`${tags.name} ILIKE ${normalizedSearch}`)
          .orderBy(asc(tags.name))
          .limit(safeLimit)
      : await this.db
          .select({
            id: tags.id,
            name: tags.name,
          })
          .from(tags)
          .orderBy(asc(tags.name))
          .limit(safeLimit);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
    }));
  }

  async listUsersForAssignment(): Promise<Array<{ id: string; fullName: string }>> {
    await this.initializeSchema();
    const rows = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .orderBy(users.firstName, users.lastName)
      .limit(200);

    return rows.map(row => {
      const firstName = row.firstName ?? '';
      const lastName = row.lastName ?? '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unassigned';

      return {
        id: row.id,
        fullName,
      };
    });
  }

  private normalizeSortField(rawField: string): string {
    const allowed = new Set(['created_at', 'updated_at', 'delivery_delay_at', 'status']);

    return allowed.has(rawField) ? rawField : 'updated_at';
  }

  private resolveSortColumn(field: string) {
    if (field === 'created_at') {
      return sales.createdAt;
    }

    if (field === 'updated_at') {
      return sales.updatedAt;
    }

    if (field === 'delivery_delay_at') {
      return sales.deliveryDelayAt;
    }

    return sales.status;
  }

  private buildWhereClause(filter: SaleFilterInput): SQL<unknown> | undefined {
    const whereClauses: SQL<unknown>[] = [];

    if (filter.search?.trim()) {
      const pattern = `%${filter.search.trim()}%`;
      whereClauses.push(
        sql`
          (${sales.externalSaleId} ILIKE ${pattern}
            OR ${listings.listingId} ILIKE ${pattern}
            OR ${listings.eventId} ILIKE ${pattern}
            OR ${sales.buyerEmail} ILIKE ${pattern})
        `,
      );
    }

    if (filter.status) {
      whereClauses.push(eq(sales.status, filter.status));
    }

    const normalizedTagIds = Array.from(new Set((filter.tagIds ?? []).map(tagId => tagId).filter(Boolean)));

    if (normalizedTagIds.length > 0) {
      const { tagIds, tagNames } = this.splitTagFilterValues(normalizedTagIds);
      const tagFilters: SQL<unknown>[] = [];

      if (tagIds.length > 0) {
        tagFilters.push(inArray(saleTags.tagId, tagIds));
      }

      if (tagNames.length > 0) {
        tagFilters.push(inArray(sql`lower(${tags.name})`, tagNames));
      }

      if (tagFilters.length > 0) {
        const tagSaleIds = this.db
          .select({ saleId: saleTags.saleId })
          .from(saleTags)
          .leftJoin(tags, eq(tags.id, saleTags.tagId))
          .where(tagFilters.length === 1 ? tagFilters[0] : or(...tagFilters));

        whereClauses.push(inArray(sales.id, tagSaleIds));
      }
    }

    if (filter.has_delay === true) {
      whereClauses.push(sql`${sales.deliveryDelayAt} IS NOT NULL`);
    }

    if (filter.has_delay === false) {
      whereClauses.push(sql`${sales.deliveryDelayAt} IS NULL`);
    }

    if (filter.overdue_only === true) {
      whereClauses.push(lt(sales.deliveryDelayAt, new Date()));
    }

    if (whereClauses.length === 0) {
      return undefined;
    }

    return and(...whereClauses);
  }

  private async updateSale(
    id: string,
    values: {
      status?: SaleStatus;
      deliveryDelayAt?: string | null;
      problemReason?: string | null;
      filledByUserId?: string | null;
    },
    expectedUpdatedAt?: string | null,
  ): Promise<Sale | null> {
    await this.initializeSchema();

    const where = expectedUpdatedAt
      ? and(eq(sales.id, id), eq(sales.updatedAt, this.toDate(expectedUpdatedAt)))
      : eq(sales.id, id);

    const { status, deliveryDelayAt, problemReason, filledByUserId } = values;

    const updatePayload: {
      status?: SaleStatus;
      deliveryDelayAt?: Date | null;
      problemReason?: string | null;
      filledByUserId?: string | null;
      updatedAt: Date;
    } = {
      status,
      problemReason,
      filledByUserId,
      updatedAt: new Date(),
    };

    if (deliveryDelayAt !== undefined) {
      updatePayload.deliveryDelayAt = deliveryDelayAt === null ? null : this.toDate(deliveryDelayAt);
    }

    const updateResult = await this.db.update(sales).set(updatePayload).where(where).returning({ id: sales.id });

    if (updateResult.length === 0) {
      return null;
    }

    return await this.findById(id);
  }

  private async loadTagsForSales(saleIds: string[]): Promise<Map<string, DashboardTag[]>> {
    if (saleIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        saleId: saleTags.saleId,
        id: tags.id,
        name: tags.name,
      })
      .from(saleTags)
      .leftJoin(tags, eq(tags.id, saleTags.tagId))
      .where(inArray(saleTags.saleId, saleIds))
      .orderBy(tags.name);

    const tagsBySale = new Map<string, DashboardTag[]>();

    for (const row of rows) {
      if (!row.id || !row.name) {
        continue;
      }

      const existing = tagsBySale.get(row.saleId) ?? [];
      existing.push({
        id: row.id,
        name: row.name,
      });
      tagsBySale.set(row.saleId, existing);
    }

    return tagsBySale;
  }

  private splitTagFilterValues(tagIds: string[]): {
    tagIds: string[];
    tagNames: string[];
  } {
    const normalizedTagIds = new Set<string>();
    const normalizedTagNames = new Set<string>();

    for (const rawTag of tagIds) {
      const normalized = rawTag.trim().replace(/\s+/g, ' ');

      if (!normalized) {
        continue;
      }

      if (this.isLikelyTagId(normalized)) {
        normalizedTagIds.add(normalized);
        continue;
      }

      normalizedTagNames.add(normalized.toLowerCase());
    }

    return {
      tagIds: [...normalizedTagIds],
      tagNames: [...normalizedTagNames],
    };
  }

  private isLikelyTagId(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async loadCommentsForSales(saleIds: string[]): Promise<Map<string, SaleComment[]>> {
    if (saleIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        saleId: saleComments.saleId,
        id: saleComments.id,
        comment: saleComments.comment,
        createdAt: saleComments.createdAt,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(saleComments)
      .leftJoin(users, eq(users.id, saleComments.authorUserId))
      .where(inArray(saleComments.saleId, saleIds))
      .orderBy(saleComments.createdAt);

    const commentsBySale = new Map<string, SaleComment[]>();

    for (const row of rows) {
      const saleId = row.saleId as string;
      const list = commentsBySale.get(saleId) ?? [];

      list.push({
        id: row.id,
        author: this.authorName(row.authorFirstName ?? null, row.authorLastName ?? null),
        comment: row.comment,
        createdAt: this.toDateString(row.createdAt),
      });
      commentsBySale.set(saleId, list);
    }

    return commentsBySale;
  }

  private async loadUsersForSaleOwners(saleIds: string[]): Promise<Map<string, UserRecord>> {
    if (saleIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        saleId: sales.id,
        id: users.id,
        authSub: users.authSub,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(sales)
      .leftJoin(users, eq(users.id, sales.filledByUserId))
      .where(inArray(sales.id, saleIds));

    const map = new Map<string, UserRecord>();

    for (const row of rows) {
      if (!row.id) {
        continue;
      }

      const firstName = row.firstName ?? '';
      const lastName = row.lastName ?? '';
      const fullName = `${firstName} ${lastName}`.trim() || 'Unassigned';

      map.set(row.saleId, {
        id: row.id,
        authSub: row.authSub ?? null,
        firstName,
        lastName,
        fullName,
      });
    }

    return map;
  }

  private async ensureCommentAuthorUserId(): Promise<string> {
    const rows = await this.db.select({ id: users.id }).from(users).orderBy(desc(users.createdAt)).limit(1);

    if (rows.length > 0) {
      return rows[0].id;
    }

    const [inserted] = await this.db
      .insert(users)
      .values({
        id: randomUUID(),
        authSub: 'seed-system-operator',
        firstName: 'System',
        lastName: 'Operator',
      })
      .returning({ id: users.id });

    if (!inserted?.id) {
      throw new Error('Could not create system author user');
    }

    return inserted.id;
  }

  private async getUserFullName(userId: string): Promise<string> {
    const [row] = await this.db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!row) {
      return 'Unknown';
    }

    return this.authorName(row.firstName ?? null, row.lastName ?? null);
  }

  private mapRow(
    row: SaleQueryRow,
    tags: DashboardTag[] = [],
    comments: SaleComment[] = [],
    filledBy: UserRecord | null = null,
  ): Sale {
    return {
      id: row.sale.id,
      externalSaleId: row.sale.externalSaleId,
      listing: this.normalizeListing(row.listing),
      buyerEmail: row.sale.buyerEmail,
      sourcePayload: row.sale.sourcePayload,
      status: this.normalizeSaleStatus(row.sale.status),
      deliveryDelayAt: row.sale.deliveryDelayAt ? this.toDateString(row.sale.deliveryDelayAt) : null,
      problemReason: row.sale.problemReason ?? null,
      filledBy,
      dashboardTags: tags,
      comments,
      createdAt: this.toDateString(row.sale.createdAt),
      updatedAt: this.toDateString(row.sale.updatedAt),
    };
  }

  private normalizeListing(listing: SaleQueryRow['listing']): Listing | null {
    if (!listing || !listing.id) {
      return null;
    }

    return {
      id: listing.id,
      sourceListingId: listing.sourceListingId ?? '',
      listingId: listing.listingId ?? null,
      adviceIndex: listing.adviceIndex,
      area: listing.area,
      assignedPos: listing.assignedPos,
      creationDate: listing.creationDate ? this.toDateString(listing.creationDate) : null,
      creationType: listing.creationType,
      eventId: listing.eventId,
      eventName: listing.eventName,
      exchange: listing.exchange,
      exchangesForSale: listing.exchangesForSale ?? [],
      extraFee: this.normalizeNumberFromDb(listing.extraFee),
      faceValue: this.normalizeNumberFromDb(listing.faceValue),
      lastPosModificationDate: listing.lastPosModificationDate
        ? this.toDateString(listing.lastPosModificationDate)
        : null,
      lowerPrice: this.normalizeNumberFromDb(listing.lowerPrice),
      offerId: listing.offerId,
      originalSection: listing.originalSection,
      placesIds: listing.placesIds ?? [],
      price: this.normalizeNumberFromDb(listing.price),
      priceMultiplier: this.normalizeNumberFromDb(listing.priceMultiplier),
      pricingRuleMultiplierChangeTime: listing.pricingRuleMultiplierChangeTime
        ? this.toDateString(listing.pricingRuleMultiplierChangeTime)
        : null,
      quality: this.normalizeNumberFromDb(listing.quality),
      quantity: listing.quantity,
      row: listing.row,
      rulePriceMultiplierIndex: listing.rulePriceMultiplierIndex,
      section: listing.section,
      splitRule: listing.splitRule,
      startRow: listing.startRow,
      status: listing.status,
      statusChangeDate: listing.statusChangeDate ? this.toDateString(listing.statusChangeDate) : null,
      subPlatform: listing.subPlatform,
      ticketTypeName: listing.ticketTypeName,
      venueName: listing.venueName,
      fees: listing.fees,
      tags: listing.tags ?? [],
      sourcePayload: listing.sourcePayload ?? null,
      createdAt: listing.createdAt ? this.toDateString(listing.createdAt) : new Date().toISOString(),
      updatedAt: listing.updatedAt ? this.toDateString(listing.updatedAt) : new Date().toISOString(),
    };
  }

  private parseDecimalForDb(value: number | null | undefined): string | null {
    if (value == null || Number.isNaN(value)) {
      return null;
    }

    return String(value);
  }

  private normalizeNumberFromDb(value: string | number | null): number | null {
    if (value == null) {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);

    return Number.isNaN(parsed) ? null : parsed;
  }

  private parseDateField(value?: string | null): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDate(value: string | Date | null | undefined): Date {
    if (value == null) {
      throw new Error('Date value is required');
    }

    const parsed = typeof value === 'string' ? new Date(value) : value;

    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date value: ${value}`);
    }

    return parsed;
  }

  private toDateString(value: string | Date): string {
    const parsed = typeof value === 'string' ? new Date(value) : value;

    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return parsed.toISOString();
  }

  private authorName(firstName: string | null, lastName: string | null): string {
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

    return fullName || 'Unknown';
  }

  private normalizeSaleStatus(value: string): SaleStatus {
    if (
      value === SaleStatus.RECEIVED ||
      value === SaleStatus.COMPLETED ||
      value === SaleStatus.DELAYED ||
      value === SaleStatus.PROBLEM
    ) {
      return value;
    }

    return SaleStatus.RECEIVED;
  }
}
