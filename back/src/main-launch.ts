/* eslint-disable import/first */
import { loadEnvVars } from '../loadEnvVars';

loadEnvVars();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { env } from './app.env';
import { AppModule } from './app.module';
import { SalesIngestionService } from './modules/sales/sales-ingestion.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix(env.API_PREFIX);
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();

  const ingestionService = app.get(SalesIngestionService);
  await ingestionService.start();

  await app.listen(env.PORT);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Sales unified API/ingestion running on: http://localhost:${env.PORT}/${env.API_PREFIX}`);
}

bootstrap().catch(error => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
