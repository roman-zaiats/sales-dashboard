import { Module } from '@nestjs/common';

import { SalesRepository } from './sales.repository';
import { SalesResolver } from './sales.resolver';
import { SalesService } from './sales.service';
import { SalesDbModule } from './sales-db.module';
import { SalesIngestionService } from './sales-ingestion.service';
import { SalesImportService } from './sales-import.service';

@Module({
  imports: [SalesDbModule],
  providers: [SalesRepository, SalesService, SalesResolver, SalesIngestionService, SalesImportService],
  exports: [SalesService, SalesImportService],
})
export class SalesModule {}
