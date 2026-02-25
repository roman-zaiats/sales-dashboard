import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger, Injectable } from '@nestjs/common';

import { SaleStatus, type SaleSourceRecord } from './sales.types';
import { SalesRepository } from './sales.repository';

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

  async importFromCompassBackup(
    filePath: string,
    sourceSyncState: string,
  ): Promise<CompassImportSummary> {
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

    const result = await this.salesRepository.upsertSalesFromSource(
      mappedRows,
      sourceSyncState,
    );

    this.logger.log(`Import complete for ${readResult.path}: ${result.insertedCount} inserted, ${result.updatedCount} updated`);

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

    const possibleArrays = [
      'documents',
      'rows',
      'data',
      'results',
      'tickets',
      'sales',
      'items',
    ] as const;

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
    const externalSaleId = this.extractExternalSaleId(record);
    if (!externalSaleId) {
      return null;
    }

    const createdAt = this.parseDate(record.creationDate) ?? this.parseDate(record.statusChangeDate) ?? new Date();
    const updatedAt = this.parseDate(record.statusChangeDate) ?? this.parseDate(record.creationDate) ?? new Date();

    return {
      externalSaleId,
      listingId: this.normalizeText(record.ticketGroupId) ?? this.normalizeText(record.listingId) ?? null,
      eventId: this.normalizeText(record.eventId),
      quantity: this.normalizeInteger(record.quantity),
      price: this.parseDecimal(record.price) ?? this.parseDecimal(record.lowerPrice),
      currency: this.normalizeText(record.currency),
      buyerEmail: this.normalizeText(record.buyerEmail),
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      sourceStatus: this.normalizeStatus(record.status),
      sourcePayload: null,
    };
  }

  private extractExternalSaleId(record: UnknownRecord): string | null {
    return this.normalizeText(this.unwrapId(record._id) ?? record.ticketGroupId ?? record.listingId ?? record.external_sale_id ?? record.externalSaleId);
  }

  private unwrapId(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === 'object' && value !== null && '$oid' in value && typeof value.$oid === 'string') {
      const text = value.$oid.trim();
      return text.length > 0 ? text : null;
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
    }

    return null;
  }

  private parseDecimal(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (value && typeof value === 'object' && typeof value.$numberDecimal === 'string') {
      const parsed = Number(value.$numberDecimal);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private normalizeInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }

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

  private normalizeStatus(value: unknown): SaleStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === SaleStatus.RECEIVED || normalized === 'INITIATED') {
      return SaleStatus.RECEIVED;
    }
    if (normalized === 'SOLD' || normalized === SaleStatus.COMPLETED) {
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
}
