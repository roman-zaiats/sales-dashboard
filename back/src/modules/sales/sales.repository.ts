import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

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
import { SALES_PG_POOL } from './sales-db.module';
import { salesSchemaSql } from './sales-schema';

@Injectable()
export class SalesRepository {
  constructor(@Inject(SALES_PG_POOL) private readonly pool: Pool) {}

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

    const whereClauses: string[] = [];
    const whereParams: Array<string | number | null | boolean | string[]> = [];

    const addWhereParam = (value: string | number | boolean | null | string[]) => {
      whereParams.push(value);

      return `$${whereParams.length}`;
    };

    if (filter.search) {
      const searchParam = addWhereParam(`%${filter.search}%`);
      whereClauses.push(
        `(listing_id ILIKE ${searchParam} OR event_id ILIKE ${searchParam} OR buyer_email ILIKE ${searchParam} OR external_sale_id ILIKE ${searchParam})`,
      );
    }

    if (filter.status) {
      whereClauses.push(`status = ${addWhereParam(filter.status)}`);
    }

    if (filter.tagIds?.length) {
      whereClauses.push(`id IN (
        SELECT st.sale_id
        FROM sale_tags st
        WHERE st.tag_id = ANY(${addWhereParam(filter.tagIds)}::uuid[])
      )`);
    }

    if (filter.has_delay === true) {
      whereClauses.push('delivery_delay_at IS NOT NULL');
    }

    if (filter.has_delay === false) {
      whereClauses.push('delivery_delay_at IS NULL');
    }

    if (filter.overdue_only === true) {
      whereClauses.push('delivery_delay_at < NOW()');
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `
      SELECT
        id, external_sale_id, listing_id, event_id, quantity, price, currency, buyer_email,
        status, delivery_delay_at, problem_reason,
        filled_by_user_id, created_at, updated_at, source_created_at, source_updated_at, source_payload
      FROM sales
      ${where}
      ORDER BY ${this.buildOrderClause(sortBy, order)}
      LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}
    `;

    const queryResult = await this.pool.query(query, [...whereParams, limit, offset]);

    const saleIds = queryResult.rows.map(row => String(row.id));
    const [tagsBySaleId, commentsBySaleId, usersBySaleId] = await Promise.all([
      this.loadTagsForSales(saleIds),
      this.loadCommentsForSales(saleIds),
      this.loadUsersForSaleOwners(saleIds),
    ]);

    const totalResult = await this.pool.query(`SELECT COUNT(*)::int AS total FROM sales ${where}`, whereParams);

    const total = totalResult.rows[0]?.total;

    return {
      items: queryResult.rows.map(row =>
        this.mapRow(
          row,
          tagsBySaleId.get(String(row.id)) ?? [],
          commentsBySaleId.get(String(row.id)) ?? [],
          usersBySaleId.get(String(row.id)) ?? null,
        ),
      ),
      totalCount: Number(total ?? 0),
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

  async updateStatus(id: string, status: SaleStatus): Promise<Sale> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `
      UPDATE sales
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [status, id],
    );

    if (response.rowCount === 0) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async updateDelay(id: string, deliveryDelayAt: string | null): Promise<Sale> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `
      UPDATE sales
      SET delivery_delay_at = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [deliveryDelayAt, id],
    );

    if (response.rowCount === 0) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async updateProblem(id: string, problemReason: string | null): Promise<Sale> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `
      UPDATE sales
      SET problem_reason = $1, updated_at = NOW()
      WHERE id = $2
      `,
      [problemReason, id],
    );

    if (response.rowCount === 0) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async setSaleFilledBy(id: string, userId: string): Promise<Sale> {
    await this.initializeSchema();

    const response = await this.pool.query(
      `
      UPDATE sales
      SET filled_by_user_id = $2, updated_at = NOW()
      WHERE id = $1
      `,
      [id, userId],
    );

    if (response.rowCount === 0) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async addSaleTag(id: string, tagName: string): Promise<Sale> {
    await this.initializeSchema();
    const normalizedTagName = tagName.trim();

    if (!normalizedTagName) {
      throw new Error('tag_name cannot be empty');
    }

    await this.pool.query(
      `
      INSERT INTO tags (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      `,
      [normalizedTagName],
    );

    const tagResponse = await this.pool.query(
      `
      SELECT id FROM tags WHERE name = $1
      `,
      [normalizedTagName],
    );

    if (tagResponse.rowCount === 0) {
      throw new Error(`Tag could not be created: ${normalizedTagName}`);
    }

    const linkResponse = await this.pool.query(
      `
      INSERT INTO sale_tags (sale_id, tag_id)
      SELECT $1, $2
      ON CONFLICT (sale_id, tag_id) DO NOTHING
      `,
      [id, tagResponse.rows[0].id],
    );

    if (linkResponse.rowCount && linkResponse.rowCount > 0) {
      await this.pool.query(
        `
        UPDATE sales
        SET updated_at = NOW()
        WHERE id = $1
        `,
        [id],
      );
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async removeSaleTag(id: string, tagName: string): Promise<Sale> {
    await this.initializeSchema();
    const normalizedTagName = tagName.trim();

    if (!normalizedTagName) {
      throw new Error('tag_name cannot be empty');
    }

    const tagResponse = await this.pool.query(
      `
      SELECT id FROM tags WHERE name = $1
      `,
      [normalizedTagName],
    );

    if (tagResponse.rowCount === 0) {
      const updated = await this.findById(id);

      if (!updated) {
        throw new Error(`Sale not found: ${id}`);
      }

      return updated;
    }

    const unlinkResponse = await this.pool.query(
      `
      DELETE FROM sale_tags
      WHERE sale_id = $1 AND tag_id = $2
      `,
      [id, tagResponse.rows[0].id],
    );

    if (unlinkResponse.rowCount && unlinkResponse.rowCount > 0) {
      await this.pool.query(
        `
        UPDATE sales
        SET updated_at = NOW()
        WHERE id = $1
        `,
        [id],
      );
    }

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async addSaleComment(id: string, comment: string): Promise<SaleComment> {
    await this.initializeSchema();
    const authorUserId = await this.ensureCommentAuthorUserId();

    const response = await this.pool.query(
      `
      INSERT INTO sale_comments (sale_id, author_user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING id, comment, created_at
      `,
      [id, authorUserId, comment],
    );

    await this.pool.query(
      `
      UPDATE sales
      SET updated_at = NOW()
      WHERE id = $1
      `,
      [id],
    );

    const authorResponse = await this.pool.query(
      `
      SELECT COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS author
      FROM users u
      WHERE u.id = $1
      `,
      [authorUserId],
    );

    return {
      id: response.rows[0].id as string,
      comment: response.rows[0].comment as string,
      createdAt: String(response.rows[0].created_at),
      author: String(authorResponse.rows[0]?.author ?? 'Unknown'),
    };
  }

  async findById(id: string): Promise<Sale | null> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `
      SELECT
        id, external_sale_id, listing_id, event_id, quantity, price, currency, buyer_email,
        status, delivery_delay_at, problem_reason, filled_by_user_id,
        created_at, updated_at, source_created_at, source_updated_at, source_payload
      FROM sales
      WHERE id = $1
      `,
      [id],
    );

    if (response.rowCount === 0) {
      return null;
    }

    const row = response.rows[0];
    const [tagsBySaleId, commentsBySaleId, usersBySaleId] = await Promise.all([
      this.loadTagsForSales([row.id]),
      this.loadCommentsForSales([row.id]),
      this.loadUsersForSaleOwners([row.id]),
    ]);

    return this.mapRow(
      row,
      tagsBySaleId.get(String(row.id)) ?? [],
      commentsBySaleId.get(String(row.id)) ?? [],
      usersBySaleId.get(String(row.id)) ?? null,
    );
  }

  async getIngestionCursor(key: string): Promise<string | null> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `
      SELECT value FROM ingestion_state
      WHERE key = $1
      `,
      [key],
    );

    if (response.rowCount === 0) {
      return null;
    }

    return response.rows[0]?.value as string | null;
  }

  async setIngestionCursor(key: string, value: string): Promise<void> {
    await this.initializeSchema();
    await this.pool.query(
      `
      INSERT INTO ingestion_state (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
      `,
      [key, value],
    );
  }

  async startIngestionRun(): Promise<string> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `
      INSERT INTO sale_ingestion_runs (status, started_at)
      VALUES ('running', NOW())
      RETURNING id
      `,
    );

    return response.rows[0].id as string;
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
    await this.pool.query(
      `
      UPDATE sale_ingestion_runs
      SET status = 'success',
          finished_at = NOW(),
          processed_count = $2,
          inserted_count = $3,
          updated_count = $4
      WHERE id = $1
      `,
      [runId, payload.processedCount, payload.insertedCount, payload.updatedCount],
    );
  }

  async finishIngestionRunFailure(runId: string, errorMessage: string): Promise<void> {
    await this.initializeSchema();
    await this.pool.query(
      `
      UPDATE sale_ingestion_runs
      SET status = 'failure',
          finished_at = NOW(),
          error_message = $2
      WHERE id = $1
      `,
      [runId, errorMessage],
    );
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
    const existingResponse = await this.pool.query(
      `
      SELECT external_sale_id
      FROM sales
      WHERE external_sale_id = ANY($1::text[])
      `,
      [externalIds],
    );

    const existingSet = new Set((existingResponse.rows ?? []).map(row => String(row.external_sale_id)));

    const upsertSql = `
      INSERT INTO sales (
        external_sale_id, listing_id, event_id, quantity, price, currency, buyer_email,
        status, source_created_at, source_updated_at, source_payload, source_sync_state
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12
      )
      ON CONFLICT (external_sale_id) DO UPDATE SET
        listing_id = EXCLUDED.listing_id,
        event_id = EXCLUDED.event_id,
        quantity = EXCLUDED.quantity,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        buyer_email = EXCLUDED.buyer_email,
        source_created_at = EXCLUDED.source_created_at,
        source_updated_at = EXCLUDED.source_updated_at,
        source_payload = EXCLUDED.source_payload,
        source_sync_state = EXCLUDED.source_sync_state,
        status = sales.status,
        delivery_delay_at = sales.delivery_delay_at,
        problem_reason = sales.problem_reason,
        filled_by_user_id = sales.filled_by_user_id
      `;

    for (const record of uniqueRecords) {
      await this.pool.query(upsertSql, [
        record.externalSaleId,
        record.listingId,
        record.eventId,
        record.quantity,
        record.price,
        record.currency,
        record.buyerEmail,
        record.sourceStatus ?? SaleStatus.RECEIVED,
        record.sourceCreatedAt,
        record.sourceUpdatedAt,
        record.sourcePayload ?? null,
        sourceSyncState,
      ]);
    }

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

    const response = await this.pool.query(`SELECT COUNT(*)::int AS total FROM sales WHERE id = ANY($1::uuid[])`, [
      ids,
    ]);

    return Number(response.rows[0]?.total ?? 0);
  }

  async listUsersForAssignment(): Promise<Array<{ id: string; fullName: string }>> {
    await this.initializeSchema();
    const response = await this.pool.query(
      `SELECT id, first_name, last_name FROM users ORDER BY first_name, last_name LIMIT 200`,
    );

    return response.rows.map(row => ({
      id: row.id,
      fullName: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Unassigned',
    }));
  }

  private normalizeSortField(rawField: string): string {
    const allowed = new Set(['created_at', 'updated_at', 'delivery_delay_at', 'status']);

    return allowed.has(rawField) ? rawField : 'updated_at';
  }

  private buildOrderClause(sortBy: string, order: 'ASC' | 'DESC'): string {
    return `${sortBy} ${order} NULLS LAST, created_at ${order}, id ${order}`;
  }

  private async loadTagsForSales(saleIds: string[]): Promise<Map<string, SaleTag[]>> {
    if (saleIds.length === 0) {
      return new Map();
    }

    const response = await this.pool.query(
      `
      SELECT
        st.sale_id,
        st.tag_id AS id,
        t.name
      FROM sale_tags st
      LEFT JOIN tags t ON t.id = st.tag_id
      WHERE st.sale_id = ANY($1::uuid[])
      ORDER BY t.name ASC
      `,
      [saleIds],
    );

    const tagsBySale = new Map<string, SaleTag[]>();

    for (const row of response.rows) {
      const saleId = row.sale_id as string;
      const existing = tagsBySale.get(saleId) ?? [];
      const name = row.name as string | null;

      if (!name) {
        continue;
      }

      existing.push({
        id: row.id as string,
        name,
      });
      tagsBySale.set(saleId, existing);
    }

    return tagsBySale;
  }

  private async loadCommentsForSales(saleIds: string[]): Promise<Map<string, SaleComment[]>> {
    if (saleIds.length === 0) {
      return new Map();
    }

    const response = await this.pool.query(
      `
      SELECT
        c.sale_id,
        c.id,
        c.comment,
        c.created_at,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS author
      FROM sale_comments c
      LEFT JOIN users u ON u.id = c.author_user_id
      WHERE c.sale_id = ANY($1::uuid[])
      ORDER BY c.created_at ASC
      `,
      [saleIds],
    );

    const commentsBySale = new Map<string, SaleComment[]>();

    for (const row of response.rows) {
      const saleId = row.sale_id as string;
      const list = commentsBySale.get(saleId) ?? [];
      list.push({
        id: row.id as string,
        author: String(row.author ?? 'Unknown'),
        comment: row.comment as string,
        createdAt: String(row.created_at),
      });
      commentsBySale.set(saleId, list);
    }

    return commentsBySale;
  }

  private async loadUsersForSaleOwners(saleIds: string[]): Promise<Map<string, UserRecord>> {
    if (saleIds.length === 0) {
      return new Map();
    }

    const response = await this.pool.query(
      `
      SELECT
        s.id AS sale_id,
        u.id,
        u.auth_sub,
        u.first_name,
        u.last_name
      FROM sales s
      LEFT JOIN users u ON u.id = s.filled_by_user_id
      WHERE s.id = ANY($1::uuid[]) AND u.id IS NOT NULL
      `,
      [saleIds],
    );

    const map = new Map<string, UserRecord>();

    for (const row of response.rows) {
      const firstName = row.first_name as string | null;
      const lastName = row.last_name as string | null;
      const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Unassigned';
      map.set(row.sale_id as string, {
        id: row.id as string,
        authSub: (row.auth_sub as string | null) ?? null,
        firstName: firstName ?? '',
        lastName: lastName ?? '',
        fullName,
      });
    }

    return map;
  }

  private async ensureCommentAuthorUserId(): Promise<string> {
    const response = await this.pool.query(
      `
      SELECT id FROM users
      ORDER BY created_at DESC
      LIMIT 1
      `,
    );

    if (response.rowCount && response.rowCount > 0) {
      return response.rows[0].id as string;
    }

    const inserted = await this.pool.query(
      `
      INSERT INTO users (id, auth_sub, first_name, last_name)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id
      `,
      ['seed-system-operator', 'System', 'Operator'],
    );

    return inserted.rows[0].id as string;
  }

  private mapRow(
    row: Record<string, unknown>,
    tags: SaleTag[] = [],
    comments: SaleComment[] = [],
    filledBy: UserRecord | null = null,
  ): Sale {
    return {
      id: row.id as string,
      externalSaleId: row.external_sale_id as string,
      listingId: (row.listing_id as string | null) ?? null,
      eventId: (row.event_id as string | null) ?? null,
      quantity: (row.quantity as number | null) ?? null,
      price: row.price == null ? null : Number(row.price as string),
      currency: row.currency as string | null,
      buyerEmail: row.buyer_email as string | null,
      sourcePayload: row.source_payload ? (row.source_payload as Record<string, unknown>) : null,
      status: row.status as SaleStatus,
      deliveryDelayAt: row.delivery_delay_at ? String(row.delivery_delay_at) : null,
      problemReason: row.problem_reason as string | null,
      filledBy,
      tags,
      comments,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      sourceCreatedAt: (row.source_created_at as string | null) ?? null,
      sourceUpdatedAt: (row.source_updated_at as string | null) ?? null,
    };
  }
}
