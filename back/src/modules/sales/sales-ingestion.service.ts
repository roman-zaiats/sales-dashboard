import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { Types } from 'mongoose';

import { env } from '../../app.env';
import { SalesService } from './sales.service';
import { SaleSourceRecord, SaleStatus } from './sales.types';

type MongoSourceRecord = Record<string, unknown>;

type IngestionCursorState = {
  sourceCreatedAt?: string | null;
  externalSaleId?: string | null;
};

type MongoCollection = {
  find: (filter: Record<string, unknown>) => {
    sort: (criteria: Record<string, number>) => {
      limit: (value: number) => {
        toArray: () => Promise<MongoSourceRecord[]>;
      };
    };
  };
};

@Injectable()
export class SalesIngestionService implements OnApplicationShutdown {
  private readonly logger = new Logger(SalesIngestionService.name);
  private isRunning = false;
  private isShuttingDown = false;
  private timer: NodeJS.Timeout | null = null;
  private mongoCollection: MongoCollection | null = null;

  constructor(private readonly salesService: SalesService) {}

  async start(): Promise<void> {
    if (this.timer) {
      return;
    }

    await this.run();
    this.timer = setInterval(() => {
      void this.run();
    }, env.MONGO_INGESTION_POLL_MS);
  }

  async stop(): Promise<void> {
    this.isShuttingDown = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (mongoose.connection.readyState > 0) {
      await mongoose.disconnect();
      this.mongoCollection = null;
    }
  }

  async onApplicationShutdown() {
    await this.stop();
  }

  private async run(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Ingestion run skipped because a previous run is still in progress');

      return;
    }

    this.isRunning = true;
    let runId: string | null = null;
    let cursorValueToPersist: string | null = null;

    try {
      runId = await this.salesService.startIngestionRun();
      const records = await this.fetchBatchFromMongo();
      const latestCursor = this.extractNewestCursorFromRecords(records);
      const sourceSyncState = JSON.stringify({
        runId,
        sourceId: latestCursor?.externalSaleId ?? null,
        at: new Date().toISOString(),
      });

      const upsertResult = await this.salesService.upsertSalesFromSource(records, sourceSyncState);

      if (latestCursor) {
        cursorValueToPersist = this.serializeIngestionCursor(latestCursor);
      }

      await this.salesService.finishIngestionRunSuccess(runId, upsertResult);

      if (cursorValueToPersist) {
        await this.salesService.setIngestionCursor(env.SYNC_SOURCE_CURSOR_KEY, cursorValueToPersist);
      }

      this.logger.debug(
        `Ingestion finished: processed=${upsertResult.processedCount}, inserted=${upsertResult.insertedCount}, updated=${upsertResult.updatedCount}`,
      );
    } catch (error) {
      const message = this.normalizeErrorMessage(error);

      if (runId) {
        try {
          await this.salesService.finishIngestionRunFailure(runId, message);
        } catch (finalizationError) {
          this.logger.error(
            `Ingestion failure could not be persisted: ${this.normalizeErrorMessage(finalizationError)}`,
          );
        }
      }

      this.logger.error(`Ingestion failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }

  private async fetchBatchFromMongo(): Promise<SaleSourceRecord[]> {
    if (this.isShuttingDown) {
      return [];
    }

    const collection = await this.getMongoCollection();
    const cursorRaw = await this.salesService.getIngestionCursor(env.SYNC_SOURCE_CURSOR_KEY);
    const parsedCursor = this.parseIngestionCursor(cursorRaw);
    const query = this.buildCursorQuery(parsedCursor);

    const records = await collection
      .find(query)
      .sort({
        creationDate: 1,
        _id: 1,
      })
      .limit(env.MONGO_INGESTION_BATCH_SIZE)
      .toArray();

    return records
      .map(record => this.mapMongoRecord(record))
      .filter((record): record is SaleSourceRecord => Boolean(record));
  }

  private async getMongoCollection(): Promise<MongoCollection> {
    if (this.mongoCollection) {
      return this.mongoCollection;
    }

    const mongoUri = env.MONGODB_URI || env.SECRET_MONGODB_URI;

    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI or SECRET_MONGODB_URI for ingestion worker');
    }

    await mongoose.connect(mongoUri, {
      dbName: env.MONGO_INGESTION_DATABASE,
    });

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('MongoDB database reference unavailable after connect');
    }

    this.mongoCollection = db.collection(env.MONGO_INGESTION_COLLECTION) as MongoCollection;

    return this.mongoCollection;
  }

  private buildCursorQuery(cursor: IngestionCursorState | null): Record<string, unknown> {
    if (!cursor) {
      return {};
    }

    const query: Record<string, unknown> = {};
    const cursorDate = this.parseDateString(cursor.sourceCreatedAt);

    if (!cursorDate) {
      if (cursor.externalSaleId) {
        query._id = { $gt: this.coerceCursorObjectId(cursor.externalSaleId) };
      }

      return query;
    }

    if (cursor.externalSaleId) {
      query.$or = [
        { creationDate: { $gt: cursorDate } },
        { 'creationDate.$date': { $gt: cursorDate } },
        {
          creationDate: cursorDate,
          _id: { $gt: this.coerceCursorObjectId(cursor.externalSaleId) },
        },
        {
          'creationDate.$date': cursorDate,
          _id: { $gt: this.coerceCursorObjectId(cursor.externalSaleId) },
        },
      ];
    } else {
      query.creationDate = { $gt: cursorDate };
    }

    return query;
  }

  private coerceCursorObjectId(value: string | null | undefined): unknown | null {
    if (!value) {
      return null;
    }

    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    return value;
  }

  private extractNewestCursorFromRecords(records: SaleSourceRecord[]): IngestionCursorState | null {
    if (records.length === 0) {
      return null;
    }

    const ordered = [...records].sort((left, right) => {
      const leftDate = this.parseDateString(left.sourceCreatedAt);
      const rightDate = this.parseDateString(right.sourceCreatedAt);

      if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
        return leftDate.getTime() - rightDate.getTime();
      }

      if (!left.sourceCreatedAt && right.sourceCreatedAt) {
        return 1;
      }

      if (left.sourceCreatedAt && !right.sourceCreatedAt) {
        return -1;
      }

      return left.externalSaleId.localeCompare(right.externalSaleId);
    });

    const newest = ordered[ordered.length - 1];

    if (!newest) {
      return null;
    }

    return {
      sourceCreatedAt: newest.sourceCreatedAt ?? null,
      externalSaleId: newest.externalSaleId,
    };
  }

  private parseIngestionCursor(rawValue: string | null): IngestionCursorState | null {
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as IngestionCursorState;

      return {
        sourceCreatedAt: parsed.sourceCreatedAt ?? null,
        externalSaleId: parsed.externalSaleId ?? null,
      };
    } catch {
      const parsedDate = this.parseDateString(rawValue);

      if (!parsedDate) {
        return null;
      }

      return {
        sourceCreatedAt: parsedDate.toISOString(),
        externalSaleId: null,
      };
    }
  }

  private serializeIngestionCursor(state: IngestionCursorState): string {
    return JSON.stringify({
      sourceCreatedAt: state.sourceCreatedAt ?? null,
      externalSaleId: state.externalSaleId ?? null,
    });
  }

  private mapMongoRecord(record: MongoSourceRecord): SaleSourceRecord | null {
    const externalSaleId =
      this.normalizeExternalSaleId(record._id) ??
      this.normalizeExternalSaleId(record.ticketGroupId) ??
      this.normalizeExternalSaleId(record.listingId) ??
      this.normalizeExternalSaleId(record.external_sale_id) ??
      this.normalizeExternalSaleId(record.externalSaleId);

    if (!externalSaleId) {
      return null;
    }

    const sourceCreatedAt = this.parseDateString(record.creationDate);
    const sourceUpdatedAt = this.parseDateString(record.statusChangeDate);

    return {
      externalSaleId,
      listingId: this.normalizeText(record.ticketGroupId) ?? this.normalizeText(record.listingId) ?? null,
      eventId: this.normalizeText(record.eventId),
      quantity: this.normalizeInt(record.quantity),
      price: this.normalizeNumber(record.price) ?? this.normalizeNumber(record.lowerPrice),
      currency: this.normalizeText(record.currency),
      buyerEmail: this.normalizeText(record.buyerEmail),
      sourceStatus: this.normalizeStatus(record.status),
      sourceCreatedAt: sourceCreatedAt ? sourceCreatedAt.toISOString() : null,
      sourceUpdatedAt: sourceUpdatedAt ? sourceUpdatedAt.toISOString() : null,
      sourcePayload: {
        raw: record,
        sourceId: externalSaleId,
      },
    };
  }

  private normalizeText(value: unknown): string | null {
    if (typeof value === 'string') {
      const normalized = value.trim();

      return normalized.length > 0 ? normalized : null;
    }

    if (typeof value === 'number') {
      const stringified = String(value);

      return stringified.length > 0 ? stringified : null;
    }

    return null;
  }

  private normalizeInt(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeStatus(value: unknown): SaleStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toUpperCase();

    if (normalized === SaleStatus.RECEIVED) {
      return SaleStatus.RECEIVED;
    }

    if (normalized === SaleStatus.COMPLETED || normalized === 'SOLD') {
      return SaleStatus.COMPLETED;
    }

    if (normalized === SaleStatus.DELAYED) {
      return SaleStatus.DELAYED;
    }

    if (normalized === SaleStatus.PROBLEM) {
      return SaleStatus.PROBLEM;
    }

    return null;
  }

  private normalizeExternalSaleId(value: unknown): string | null {
    if (typeof value === 'string') {
      const normalized = value.trim();

      return normalized.length > 0 ? normalized : null;
    }

    if (value && typeof value === 'object') {
      if ('$oid' in value && typeof value.$oid === 'string' && value.$oid.trim().length > 0) {
        return value.$oid;
      }

      if ('toString' in value && typeof value.toString === 'function') {
        const textual = value.toString();

        if (textual && textual !== '[object Object]') {
          return textual;
        }
      }
    }

    return null;
  }

  private parseDateString(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);

      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (value && typeof value === 'object' && '$date' in value) {
      const dateValue = value.$date;

      if (typeof dateValue === 'string') {
        const parsed = new Date(dateValue);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      if (typeof dateValue === 'number') {
        const parsed = new Date(dateValue);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      if (
        dateValue &&
        typeof dateValue === 'object' &&
        'toString' in dateValue &&
        typeof dateValue.toString === 'function'
      ) {
        const parsed = new Date(dateValue.toString());

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
    }

    return null;
  }

  private normalizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown ingestion error';
  }
}
