import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, lt, type SQL, sql } from 'drizzle-orm';

import { type SalesDatabaseContext } from './db/client';
import { ingestionState, saleComments, saleIngestionRuns, sales, saleTags, tags, users } from './db/schema';
import {
  PaginationInput,
  Sale,
  SaleComment,
  SaleFilterInput,
  SaleListPayload,
  SaleSortInput,
  SaleSourceRecord,
  SaleStatus,
  SaleTag,
  UserRecord,
} from './sales.types';
import { SALES_DB_CONTEXT } from './sales-db.module';
import { salesSchemaSql } from './sales-schema';

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
          id: sales.id,
          externalSaleId: sales.externalSaleId,
          listingId: sales.listingId,
          eventId: sales.eventId,
          quantity: sales.quantity,
          price: sales.price,
          currency: sales.currency,
          buyerEmail: sales.buyerEmail,
          status: sales.status,
          deliveryDelayAt: sales.deliveryDelayAt,
          problemReason: sales.problemReason,
          filledByUserId: sales.filledByUserId,
          createdAt: sales.createdAt,
          updatedAt: sales.updatedAt,
          sourcePayload: sales.sourcePayload,
        })
        .from(sales)
        .where(where)
        .orderBy(order === 'ASC' ? asc(sortColumn) : desc(sortColumn), asc(sales.createdAt), asc(sales.id))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(sales).where(where),
    ]);

    const saleIds = rows.map(row => row.id);
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
          tagsBySaleId.get(row.id) ?? [],
          commentsBySaleId.get(row.id) ?? [],
          usersBySaleId.get(row.id) ?? null,
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
        id: sales.id,
        externalSaleId: sales.externalSaleId,
        listingId: sales.listingId,
        eventId: sales.eventId,
        quantity: sales.quantity,
        price: sales.price,
        currency: sales.currency,
        buyerEmail: sales.buyerEmail,
        status: sales.status,
        deliveryDelayAt: sales.deliveryDelayAt,
        problemReason: sales.problemReason,
        filledByUserId: sales.filledByUserId,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        sourcePayload: sales.sourcePayload,
      })
      .from(sales)
      .where(eq(sales.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const [tagsBySaleId, commentsBySaleId, usersBySaleId] = await Promise.all([
      this.loadTagsForSales([row.id]),
      this.loadCommentsForSales([row.id]),
      this.loadUsersForSaleOwners([row.id]),
    ]);

    return this.mapRow(
      row,
      tagsBySaleId.get(row.id) ?? [],
      commentsBySaleId.get(row.id) ?? [],
      usersBySaleId.get(row.id) ?? null,
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

    const externalIds = uniqueRecords.map(record => record.externalSaleId);
    const existingRows = await this.db
      .select({ externalSaleId: sales.externalSaleId })
      .from(sales)
      .where(inArray(sales.externalSaleId, externalIds));
    const existingSet = new Set(existingRows.map(row => row.externalSaleId));

    await this.db
      .insert(sales)
      .values(
        uniqueRecords.map(record => ({
          externalSaleId: record.externalSaleId,
          listingId: record.listingId,
          eventId: record.eventId,
          quantity: record.quantity,
          price: record.price == null ? null : String(record.price),
          currency: record.currency,
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
          listingId: sql`EXCLUDED.listing_id`,
          eventId: sql`EXCLUDED.event_id`,
          quantity: sql`EXCLUDED.quantity`,
          price: sql`EXCLUDED.price`,
          currency: sql`EXCLUDED.currency`,
          buyerEmail: sql`EXCLUDED.buyer_email`,
          sourcePayload: sql`EXCLUDED.source_payload`,
          sourceSyncState: sql`EXCLUDED.source_sync_state`,
          status: sales.status,
          deliveryDelayAt: sales.deliveryDelayAt,
          problemReason: sales.problemReason,
          filledByUserId: sales.filledByUserId,
        },
      });

    return {
      processedCount: uniqueRecords.length,
      insertedCount: uniqueRecords.length - existingSet.size,
      updatedCount: existingSet.size,
    };
  }

  async countByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const [response] = await this.db.select({ total: count() }).from(sales).where(inArray(sales.id, ids));

    return Number(response.total ?? 0);
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
            OR ${sales.listingId} ILIKE ${pattern}
            OR ${sales.eventId} ILIKE ${pattern}
            OR ${sales.buyerEmail} ILIKE ${pattern})
        `,
      );
    }

    if (filter.status) {
      whereClauses.push(eq(sales.status, filter.status));
    }

    const normalizedTagIds = Array.from(new Set((filter.tagIds ?? []).map(tagId => tagId).filter(Boolean)));

    if (normalizedTagIds.length > 0) {
      const tagSaleIds = this.db
        .select({ saleId: saleTags.saleId })
        .from(saleTags)
        .where(inArray(saleTags.tagId, normalizedTagIds));

      whereClauses.push(inArray(sales.id, tagSaleIds));
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

  private async loadTagsForSales(saleIds: string[]): Promise<Map<string, SaleTag[]>> {
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

    const tagsBySale = new Map<string, SaleTag[]>();

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
    row: {
      id: string;
      externalSaleId: string;
      listingId: string | null;
      eventId: string | null;
      quantity: number | null;
      price: string | number | null;
      currency: string | null;
      buyerEmail: string | null;
      sourcePayload: Record<string, unknown> | null;
      status: string;
      deliveryDelayAt: string | Date | null;
      problemReason: string | null;
      filledByUserId: string | null;
      createdAt: string | Date;
      updatedAt: string | Date;
    },
    tags: SaleTag[] = [],
    comments: SaleComment[] = [],
    filledBy: UserRecord | null = null,
  ): Sale {
    return {
      id: row.id,
      externalSaleId: row.externalSaleId,
      listingId: row.listingId ?? null,
      eventId: row.eventId ?? null,
      quantity: row.quantity,
      price: this.normalizePrice(row.price),
      currency: row.currency,
      buyerEmail: row.buyerEmail,
      sourcePayload: row.sourcePayload,
      status: this.normalizeSaleStatus(row.status),
      deliveryDelayAt: row.deliveryDelayAt ? this.toDateString(row.deliveryDelayAt) : null,
      problemReason: row.problemReason ?? null,
      filledBy,
      tags,
      comments,
      createdAt: this.toDateString(row.createdAt),
      updatedAt: this.toDateString(row.updatedAt),
    };
  }

  private normalizePrice(price: string | number | null): number | null {
    if (price == null) {
      return null;
    }

    if (typeof price === 'number') {
      return price;
    }

    const parsed = Number(price);

    return Number.isNaN(parsed) ? null : parsed;
  }

  private parseDateField(value: string | null): Date | null {
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
