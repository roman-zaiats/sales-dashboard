import { Module } from '@nestjs/common';

import { SalesDbModule } from './sales-db.module';
import { SalesResolver } from './sales.resolver';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';
import { SalesIngestionService } from './sales-ingestion.service';

@Module({
  imports: [SalesDbModule],
  providers: [SalesRepository, SalesService, SalesResolver, SalesIngestionService],
  exports: [SalesService],
})
export class SalesModule {}
