import { ParseUUIDPipe } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { SalesService } from './sales.service';
import type { PaginationInput, SaleFilterInput, SaleListPayload, SaleSortInput, SaleStatus } from './sales.types';

@Resolver()
export class SalesResolver {
  constructor(private readonly salesService: SalesService) {}

  @Query()
  salesList(
    @Args('filter', { nullable: true }) filter?: SaleFilterInput,
    @Args('sort', { nullable: true }) sort?: SaleSortInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<SaleListPayload> {
    return this.salesService.listSales(filter, sort, pagination);
  }

  @Query()
  saleById(@Args('id', ParseUUIDPipe) id: string): ReturnType<SalesService['saleById']> {
    return this.salesService.saleById(id);
  }

  @Query()
  delayedSales(
    @Args('filter', { nullable: true }) filter?: SaleFilterInput,
    @Args('sort', { nullable: true }) sort?: SaleSortInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): ReturnType<SalesService['delayedSales']> {
    return this.salesService.delayedSales(filter, sort, pagination);
  }

  @Query()
  listUsersForAssignment(): ReturnType<SalesService['listUsersForAssignment']> {
    return this.salesService.listUsersForAssignment();
  }

  @Mutation()
  async updateSaleStatus(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('status') status: SaleStatus,
    @Args('expected_updated_at', { nullable: true }) expectedUpdatedAt?: string | null,
  ): ReturnType<SalesService['updateSaleStatus']> {
    return await this.salesService.updateSaleStatus(id, status, expectedUpdatedAt);
  }

  @Mutation()
  async updateSaleDelay(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('delivery_delay_at', { nullable: true }) deliveryDelayAt: string | null,
    @Args('expected_updated_at', { nullable: true }) expectedUpdatedAt?: string | null,
  ): ReturnType<SalesService['updateSaleDelay']> {
    return await this.salesService.updateSaleDelay(id, deliveryDelayAt, expectedUpdatedAt);
  }

  @Mutation()
  async updateSaleProblem(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('problem_reason', { nullable: true }) problemReason: string | null,
    @Args('expected_updated_at', { nullable: true }) expectedUpdatedAt?: string | null,
  ): ReturnType<SalesService['updateSaleProblem']> {
    return await this.salesService.updateSaleProblem(id, problemReason, expectedUpdatedAt);
  }

  @Mutation()
  async setSaleFilledBy(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('user_id', ParseUUIDPipe) userId: string,
  ): ReturnType<SalesService['setSaleFilledBy']> {
    return await this.salesService.setSaleFilledBy(id, userId);
  }

  @Mutation()
  async addSaleTag(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('tag_name') tagName: string,
  ): ReturnType<SalesService['addSaleTag']> {
    return await this.salesService.addSaleTag(id, tagName);
  }

  @Mutation()
  async removeSaleTag(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('tag_name') tagName: string,
  ): ReturnType<SalesService['removeSaleTag']> {
    return await this.salesService.removeSaleTag(id, tagName);
  }

  @Mutation()
  async addSaleComment(
    @Args('id', ParseUUIDPipe) id: string,
    @Args('comment') comment: string,
  ): ReturnType<SalesService['addSaleComment']> {
    return await this.salesService.addSaleComment(id, comment);
  }
}
