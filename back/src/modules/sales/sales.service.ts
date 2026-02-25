import { Injectable, Logger } from '@nestjs/common';

import type {
  PaginationInput,
  Sale,
  SaleComment,
  SaleFilterInput,
  SaleListPayload,
  SaleSortInput,
  SaleStatus,
} from './sales.types';
import { SalesRepository } from './sales.repository';

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
    return this.salesRepository.findById(id);
  }

  async delayedSales(
    filter: SaleFilterInput = {},
    sort: SaleSortInput = { field: 'delivery_delay_at', direction: 'ASC' },
    pagination: PaginationInput = {},
  ) {
    return this.salesRepository.listDelayedSales(
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

  async updateSaleStatus(
    id: string,
    status: SaleStatus,
    expectedUpdatedAt?: string | null,
  ): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    this.assertNotStale(sale.updatedAt, expectedUpdatedAt);
    return this.salesRepository.updateStatus(id, status);
  }

  async updateSaleDelay(id: string, deliveryDelayAt: string | null, expectedUpdatedAt?: string | null): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    this.assertNotStale(sale.updatedAt, expectedUpdatedAt);
    return this.salesRepository.updateDelay(id, deliveryDelayAt);
  }

  async updateSaleProblem(id: string, problemReason: string | null, expectedUpdatedAt?: string | null): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    this.assertNotStale(sale.updatedAt, expectedUpdatedAt);
    return this.salesRepository.updateProblem(id, problemReason);
  }

  async addSaleTag(id: string, tagName: string): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    return this.salesRepository.addSaleTag(id, tagName);
  }

  async removeSaleTag(id: string, tagName: string): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    return this.salesRepository.removeSaleTag(id, tagName);
  }

  async setSaleFilledBy(id: string, userId: string): Promise<Sale> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    return this.salesRepository.setSaleFilledBy(id, userId);
  }

  async addSaleComment(id: string, comment: string): Promise<SaleComment> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) {
      throw new Error(`Sale not found: ${id}`);
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      throw new Error('Comment cannot be empty');
    }

    return this.salesRepository.addSaleComment(id, trimmedComment);
  }

  async listUsersForAssignment() {
    return this.salesRepository.listUsersForAssignment();
  }

  private assertNotStale(
    currentUpdatedAt: string,
    expectedUpdatedAt?: string | null,
  ): void {
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
