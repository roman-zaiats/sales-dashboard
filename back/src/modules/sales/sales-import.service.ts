import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';

import { SalesRepository } from './sales.repository';
import { type ListingFee, SaleSourceRecord, SaleStatus } from './sales.types';

type UnknownRecord = Record<string, unknown>;

type CompassBackupPayload = UnknownRecord | UnknownRecord[];

type FileReadResult = {
  path: string;
  records: UnknownRecord[];
};

export type CompassImportSummary = {
  filePath: string;
  totalRows: number;
  mappedRows: number;
  skippedRows: number;
  insertedCount: number;
  updatedCount: number;
  processedCount: number;
  sourceSyncState: string;
};

@Injectable()
export class SalesImportService {
  private readonly logger = new Logger(SalesImportService.name);

  constructor(private readonly salesRepository: SalesRepository) {}

  async importFromCompassBackup(filePath: string, sourceSyncState: string): Promise<CompassImportSummary> {
    const readResult = this.readBackupFile(filePath);
    const mappedRows: SaleSourceRecord[] = [];
    let skipped = 0;

    for (const row of readResult.records) {
      const mapped = this.mapMongoRecord(row);

      if (!mapped) {
        skipped += 1;
        continue;
      }

      mappedRows.push({
        ...mapped,
        sourcePayload: {
          sourceId: mapped.externalSaleId,
          raw: row,
        },
      });
    }

    const result = await this.salesRepository.upsertSalesFromSource(mappedRows, sourceSyncState);

    this.logger.log(
      `Import complete for ${readResult.path}: ${result.insertedCount} inserted, ${result.updatedCount} updated`,
    );

    return {
      filePath: readResult.path,
      totalRows: readResult.records.length,
      mappedRows: mappedRows.length,
      skippedRows: skipped,
      insertedCount: result.insertedCount,
      updatedCount: result.updatedCount,
      processedCount: result.processedCount,
      sourceSyncState,
    };
  }

  private readBackupFile(filePath: string): FileReadResult {
    const resolvedPath = resolve(filePath);

    if (!existsSync(resolvedPath)) {
      throw new Error(`Backup file not found: ${resolvedPath}`);
    }

    const raw = readFileSync(resolvedPath, 'utf8');
    const parsed = this.parseJsonPayload(raw, resolvedPath);
    const records = this.normalizePayloadToRecords(parsed, resolvedPath);

    return {
      path: resolvedPath,
      records,
    };
  }

  private parseJsonPayload(raw: string, filePath: string): CompassBackupPayload {
    const parsed: CompassBackupPayload = JSON.parse(raw) as CompassBackupPayload;

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }

    throw new Error(`Unsupported JSON shape in backup file: ${filePath}`);
  }

  private normalizePayloadToRecords(payload: CompassBackupPayload, filePath: string): UnknownRecord[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    const possibleArrays = ['documents', 'rows', 'data', 'results', 'tickets', 'sales', 'items'] as const;

    for (const key of possibleArrays) {
      const value = payload[key];

      if (Array.isArray(value)) {
        return value as UnknownRecord[];
      }
    }

    if (payload && typeof payload === 'object' && 'document' in payload && Array.isArray(payload.document)) {
      return payload.document as UnknownRecord[];
    }

    if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
      return payload.data as UnknownRecord[];
    }

    if (payload && typeof payload === 'object' && 'rows' in payload && Array.isArray(payload.rows)) {
      return payload.rows as UnknownRecord[];
    }

    throw new Error(`Could not extract records array from backup file: ${filePath}`);
  }

  private mapMongoRecord(record: UnknownRecord): Omit<SaleSourceRecord, 'sourcePayload'> | null {
    const externalSaleId = this.extractExternalSaleId(record._id);

    if (!externalSaleId) {
      return null;
    }

    const createdAt = this.parseDate(record.creationDate)?.toISOString() ?? new Date().toISOString();
    const updatedAt = this.parseDate(record.statusChangeDate)?.toISOString() ?? createdAt;
    const listingSourceId = externalSaleId;

    return {
      externalSaleId,
      buyerEmail: this.normalizeText(record.buyerEmail),
      createdAt,
      updatedAt,
      sourceStatus: this.normalizeStatus(record.status),
      listing: {
        sourceListingId: listingSourceId,
        listingId: this.normalizeText(record.ticketGroupId),
        adviceIndex: this.normalizeInteger(record.adviceIndex),
        area: this.normalizeText(record.area),
        assignedPos: this.normalizeText(record.assignedPos),
        creationDate: this.parseDate(record.creationDate)?.toISOString(),
        creationType: this.normalizeText(record.creationType),
        eventId: this.normalizeText(record.eventId),
        eventName: this.normalizeText(record.eventName),
        exchange: this.normalizeText(record.exchange),
        exchangesForSale: this.normalizeStringArray(record.exchangesForSale),
        extraFee: this.parseDecimal(record.extraFee),
        faceValue: this.parseDecimal(record.faceValue),
        lastPosModificationDate: this.parseDate(record.lastPosModificationDate)?.toISOString(),
        lowerPrice: this.parseDecimal(record.lowerPrice),
        offerId: this.normalizeText(record.offerId),
        originalSection: this.normalizeText(record.originalSection),
        placesIds: this.normalizeStringArray(record.placesIds),
        price: this.parseDecimal(record.price),
        priceMultiplier: this.parseDecimal(record.priceMultiplier),
        pricingRuleMultiplierChangeTime: this.parseDate(record.pricingRuleMultiplierChangeTime)?.toISOString(),
        quality: this.parseDecimal(record.quality),
        quantity: this.normalizeInteger(record.quantity),
        row: this.normalizeText(record.row),
        rulePriceMultiplierIndex: this.normalizeInteger(record.rulePriceMultiplierIndex),
        section: this.normalizeText(record.section),
        splitRule: this.normalizeText(record.splitRule),
        startRow: this.normalizeText(record.startRow),
        status: this.normalizeText(record.status),
        statusChangeDate: this.parseDate(record.statusChangeDate)?.toISOString(),
        subPlatform: this.normalizeText(record.subPlatform),
        tags: this.normalizeStringArray(record.tags),
        ticketTypeName: this.normalizeText(record.ticketTypeName),
        venueName: this.normalizeText(record.venueName),
        fees: this.normalizeFees(record.fees),
        sourcePayload: {
          sourceId: listingSourceId,
          raw: record,
        },
      },
    };
  }

  private extractExternalSaleId(value: unknown): string | null {
    if (typeof value === 'string') {
      const normalized = value.trim();

      return normalized.length > 0 ? normalized : null;
    }

    if (value && typeof value === 'object' && '$oid' in value && typeof value.$oid === 'string') {
      const normalized = value.$oid.trim();

      return normalized.length > 0 ? normalized : null;
    }

    return null;
  }

  private parseDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string' || value instanceof Date) {
      const parsed = new Date(value);

      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (value && typeof value === 'object' && '$date' in value) {
      const dateValue = value.$date;

      if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const parsed = new Date(dateValue);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      if (dateValue && typeof dateValue === 'object' && 'toString' in dateValue) {
        const textual = String((dateValue as { toString: () => string }).toString());
        const parsed = new Date(textual);

        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
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

    if (value && typeof value === 'object') {
      const decimalLike = value as { $numberDecimal?: unknown };

      if (typeof decimalLike.$numberDecimal === 'string') {
        const parsed = Number(decimalLike.$numberDecimal);

        return Number.isFinite(parsed) ? parsed : null;
      }
    }

    return null;
  }

  private normalizeInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);

      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeText(value: unknown): string | null {
    if (typeof value === 'string') {
      const text = value.trim();

      return text.length > 0 ? text : null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
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
          const text = item.trim();

          return text.length > 0 ? text : null;
        }

        if (typeof item === 'number' && Number.isFinite(item)) {
          return String(item);
        }

        if (item && typeof item === 'object' && '$oid' in item && typeof item.$oid === 'string') {
          const text = item.$oid.trim();

          return text.length > 0 ? text : null;
        }

        return null;
      })
      .filter((item): item is string => item !== null);
  }

  private normalizeStatus(value: unknown): SaleStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toUpperCase();

    if (normalized === SaleStatus.RECEIVED || normalized === 'INITIATED') {
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

  private normalizeFees(value: unknown): ListingFee[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is UnknownRecord => item != null && typeof item === 'object')
      .map(item => ({
        type: typeof item.type === 'string' ? item.type : undefined,
        description: typeof item.description === 'string' ? item.description : undefined,
        amount: this.normalizeFeeAmount(item.amount),
      }));
  }

  private normalizeFeeAmount(value: unknown): string | number | null {
    const parsed = this.parseDecimal(value);

    return parsed == null ? null : parsed;
  }
}
