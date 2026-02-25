import { Module } from '@nestjs/common';

import { SalesRepository } from './sales.repository';
import { SalesResolver } from './sales.resolver';
import { SalesService } from './sales.service';
import { SalesDbModule } from './sales-db.module';
import { SalesIngestionService } from './sales-ingestion.service';

@Module({
  imports: [SalesDbModule],
  providers: [SalesRepository, SalesService, SalesResolver, SalesIngestionService],
  exports: [SalesService],
})
export class SalesModule {}
