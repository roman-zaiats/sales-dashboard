/* eslint-disable import/first */
import { loadEnvVars } from '../loadEnvVars';

loadEnvVars();

import { SalesIngestionService } from './modules/sales/sales-ingestion.service';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './app.env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const ingestionService = app.get(SalesIngestionService);
  await ingestionService.start();

  app.setGlobalPrefix(env.API_PREFIX);
  app.enableShutdownHooks();
  await app.listen(env.WORKER_PORT);
  console.log(`Sales worker running on: ${env.WORKER_PORT}`);
}

bootstrap().catch(error => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
