import { Injectable, Logger } from '@nestjs/common';

import { SalesRepository } from './sales.repository';
import type {
  PaginationInput,
  Sale,
  SaleComment,
  SaleFilterInput,
  SaleListPayload,
  SaleSortInput,
  SaleSourceRecord,
  SaleStatus,
} from './sales.types';

export const SALE_STALE_UPDATE_WARNING =
  'This sale was updated while editing. Reload and reapply your changes to avoid overwriting newer updates.';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly salesRepository: SalesRepository) {}

  async listSales(
    filter?: SaleFilterInput,
    sort?: SaleSortInput,
    pagination?: PaginationInput,
  ): Promise<SaleListPayload> {
    const payload = await this.salesRepository.listSales(filter, sort, pagination);
    this.logger.debug(`salesList requested: ${payload.totalCount} total`);

    return payload;
  }

  async saleById(id: string) {
    return await this.salesRepository.findById(id);
  }

  async delayedSales(
    filter: SaleFilterInput = {},
    sort: SaleSortInput = { field: 'delivery_delay_at', direction: 'ASC' },
    pagination: PaginationInput = {},
  ) {
    return await this.salesRepository.listDelayedSales(
      {
        ...filter,
        has_delay: true,
      },
      {
        field: sort.field ?? 'delivery_delay_at',
        direction: sort.direction ?? 'ASC',
      },
      pagination,
    );
  }

  async updateSaleStatus(id: string, status: SaleStatus, expectedUpdatedAt?: string | null): Promise<Sale> {
    return await this.mutateWithExpectedConcurrency(id, expectedUpdatedAt, async () => {
      const updated = await this.salesRepository.updateStatus(id, status, expectedUpdatedAt);

      if (!updated) {
        throw new Error(SALE_STALE_UPDATE_WARNING);
      }

      return updated;
    });
  }

  async updateSaleDelay(id: string, deliveryDelayAt: string | null, expectedUpdatedAt?: string | null): Promise<Sale> {
    return await this.mutateWithExpectedConcurrency(id, expectedUpdatedAt, async () => {
      return await this.salesRepository.updateDelay(id, deliveryDelayAt, expectedUpdatedAt);
    });
  }

  async updateSaleProblem(id: string, problemReason: string | null, expectedUpdatedAt?: string | null): Promise<Sale> {
    return await this.mutateWithExpectedConcurrency(id, expectedUpdatedAt, async () => {
      return await this.salesRepository.updateProblem(id, problemReason, expectedUpdatedAt);
    });
  }

  async setSaleFilledBy(id: string, userId: string): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);

    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.salesRepository.setSaleFilledBy(id, userId);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async addSaleTag(id: string, tagName: string): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);

    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.salesRepository.addSaleTag(id, tagName);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async removeSaleTag(id: string, tagName: string): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);

    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    const updated = await this.salesRepository.removeSaleTag(id, tagName);

    if (!updated) {
      throw new Error(`Sale ${id} was updated but could not be reloaded`);
    }

    return updated;
  }

  async addSaleComment(id: string, comment: string): Promise<SaleComment> {
    const sale = await this.salesRepository.findById(id);

    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    return await this.salesRepository.addSaleComment(id, comment);
  }

  async listUsersForAssignment() {
    return await this.salesRepository.listUsersForAssignment();
  }

  async startIngestionRun(): Promise<string> {
    return await this.salesRepository.startIngestionRun();
  }

  async finishIngestionRunSuccess(
    runId: string,
    payload: {
      processedCount: number;
      insertedCount: number;
      updatedCount: number;
    },
  ): Promise<void> {
    await this.salesRepository.finishIngestionRunSuccess(runId, payload);
  }

  async finishIngestionRunFailure(runId: string, errorMessage: string): Promise<void> {
    await this.salesRepository.finishIngestionRunFailure(runId, errorMessage);
  }

  async getIngestionCursor(key: string): Promise<string | null> {
    return await this.salesRepository.getIngestionCursor(key);
  }

  async setIngestionCursor(key: string, value: string): Promise<void> {
    await this.salesRepository.setIngestionCursor(key, value);
  }

  async upsertSalesFromSource(
    records: SaleSourceRecord[],
    sourceSyncState: string,
  ): Promise<{
    insertedCount: number;
    updatedCount: number;
    processedCount: number;
  }> {
    this.logger.debug(`Persisting ${records.length} source sales`);

    return await this.salesRepository.upsertSalesFromSource(records, sourceSyncState);
  }

  private async mutateWithExpectedConcurrency(
    id: string,
    expectedUpdatedAt: string | null | undefined,
    mutate: () => Promise<Sale | null>,
  ): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);

    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    this.assertNotStale(sale.updatedAt, expectedUpdatedAt);

    const updated = await mutate();

    if (!updated) {
      throw new Error(SALE_STALE_UPDATE_WARNING);
    }

    return updated;
  }

  private assertNotStale(currentUpdatedAt: string, expectedUpdatedAt?: string | null): void {
    if (!expectedUpdatedAt) {
      return;
    }

    const normalizedCurrent = this.normalizeUpdatedAt(currentUpdatedAt);
    const normalizedExpected = this.normalizeUpdatedAt(expectedUpdatedAt);

    if (normalizedExpected && normalizedCurrent !== normalizedExpected) {
      throw new Error(SALE_STALE_UPDATE_WARNING);
    }
  }

  private normalizeUpdatedAt(value: string): string {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.valueOf())) {
      return value;
    }

    return parsed.toISOString();
  }
}
