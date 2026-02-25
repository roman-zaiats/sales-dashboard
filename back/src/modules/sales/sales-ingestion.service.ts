import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { Types } from 'mongoose';

import { env } from '../../app.env';
import { SalesService } from './sales.service';
import { ListingFee, SaleSourceRecord, SaleStatus } from './sales.types';

type MongoSourceRecord = Record<string, unknown>;

type IngestionCursorState = {
  createdAt?: string | null;
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
    const cursorDate = this.parseDateString(cursor.createdAt);

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
      const leftDate = this.parseDateString(left.createdAt);
      const rightDate = this.parseDateString(right.createdAt);

      if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
        return leftDate.getTime() - rightDate.getTime();
      }

      if (!left.createdAt && right.createdAt) {
        return 1;
      }

      if (left.createdAt && !right.createdAt) {
        return -1;
      }

      return left.externalSaleId.localeCompare(right.externalSaleId);
    });

    const newest = ordered[ordered.length - 1];

    if (!newest) {
      return null;
    }

    return {
      createdAt: newest.createdAt ?? null,
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
        createdAt: parsed.createdAt ?? null,
        externalSaleId: parsed.externalSaleId ?? null,
      };
    } catch {
      const parsedDate = this.parseDateString(rawValue);

      if (!parsedDate) {
        return null;
      }

      return {
        createdAt: parsedDate.toISOString(),
        externalSaleId: null,
      };
    }
  }

  private serializeIngestionCursor(state: IngestionCursorState): string {
    return JSON.stringify({
      createdAt: state.createdAt ?? null,
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

    const createdAt = this.parseDateString(record.creationDate);
    const updatedAt = this.parseDateString(record.statusChangeDate);
    const sourceListingId =
      this.normalizeExternalSaleId(record._id) ?? this.normalizeExternalSaleId(record.ticketGroupId) ?? externalSaleId;

    return {
      externalSaleId,
      buyerEmail: this.normalizeText(record.buyerEmail),
      sourceStatus: this.normalizeStatus(record.status),
      createdAt: createdAt ? createdAt.toISOString() : null,
      updatedAt: updatedAt ? updatedAt.toISOString() : null,
      sourcePayload: {
        raw: record,
        sourceId: externalSaleId,
      },
      listing: {
        sourceListingId,
        listingId: this.normalizeText(record.ticketGroupId) ?? this.normalizeText(record.listingId),
        adviceIndex: this.normalizeInt(record.adviceIndex),
        area: this.normalizeText(record.area),
        assignedPos: this.normalizeText(record.assignedPos),
        creationDate: createdAt ? createdAt.toISOString() : null,
        creationType: this.normalizeText(record.creationType),
        eventId: this.normalizeText(record.eventId),
        eventName: this.normalizeText(record.eventName),
        exchange: this.normalizeText(record.exchange),
        exchangesForSale: this.normalizeStringArray(record.exchangesForSale),
        extraFee: this.parseDecimal(record.extraFee),
        faceValue: this.parseDecimal(record.faceValue),
        lastPosModificationDate: this.parseDateString(record.lastPosModificationDate)?.toISOString() ?? null,
        lowerPrice: this.parseDecimal(record.lowerPrice),
        offerId: this.normalizeText(record.offerId),
        originalSection: this.normalizeText(record.originalSection),
        placesIds: this.normalizeStringArray(record.placesIds),
        price: this.parseDecimal(record.price),
        priceMultiplier: this.parseDecimal(record.priceMultiplier),
        pricingRuleMultiplierChangeTime:
          this.parseDateString(record.pricingRuleMultiplierChangeTime)?.toISOString() ?? null,
        quality: this.parseDecimal(record.quality),
        quantity: this.normalizeInt(record.quantity),
        row: this.normalizeText(record.row),
        rulePriceMultiplierIndex: this.normalizeInt(record.rulePriceMultiplierIndex),
        section: this.normalizeText(record.section),
        splitRule: this.normalizeText(record.splitRule),
        startRow: this.normalizeText(record.startRow),
        status: this.normalizeText(record.status),
        statusChangeDate: this.parseDateString(record.statusChangeDate)?.toISOString() ?? null,
        subPlatform: this.normalizeText(record.subPlatform),
        tags: this.normalizeStringArray(record.tags),
        ticketTypeName: this.normalizeText(record.ticketTypeName),
        venueName: this.normalizeText(record.venueName),
        fees: this.normalizeFees(record.fees),
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

  private parseDecimal(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    }

    if (value && typeof value === 'object' && '$numberDecimal' in value && typeof value.$numberDecimal === 'string') {
      const parsed = Number(value.$numberDecimal);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map(item => {
        if (typeof item === 'string') {
          const normalized = item.trim();

          return normalized.length > 0 ? normalized : null;
        }

        if (typeof item === 'number' && Number.isFinite(item)) {
          return String(item);
        }

        if (item && typeof item === 'object' && '$oid' in item && typeof item.$oid === 'string') {
          const normalized = item.$oid.trim();

          return normalized.length > 0 ? normalized : null;
        }

        if (item && typeof item === 'object' && '$numberDecimal' in item && typeof item.$numberDecimal === 'string') {
          const normalized = item.$numberDecimal.trim();

          return normalized.length > 0 ? normalized : null;
        }

        return null;
      })
      .filter((item): item is string => item !== null);
  }

  private normalizeFees(value: unknown): ListingFee[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
      .map(item => ({
        type: typeof item.type === 'string' ? item.type : undefined,
        description: typeof item.description === 'string' ? item.description : undefined,
        amount: this.parseDecimal(item.amount),
      }));
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
