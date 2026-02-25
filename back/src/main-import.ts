/* eslint-disable import/first */
import { loadEnvVars } from '../loadEnvVars';

loadEnvVars();

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { SalesImportService } from './modules/sales/sales-import.service';

type ImportCliOptions = {
  filePath: string | null;
  sourceSyncState: string | null;
  help: boolean;
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help || !options.filePath) {
    printUsage();
    process.exit(options.filePath ? 0 : 1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const importService = app.get(SalesImportService);

  const sourceSyncState = options.sourceSyncState ?? `cli-import:${new Date().toISOString()}`;

  try {
    const result = await importService.importFromCompassBackup(options.filePath, sourceSyncState);

    console.log(`Import finished for file: ${result.filePath}`);
    console.log(`Total rows in file: ${result.totalRows}`);
    console.log(`Rows mapped to sales: ${result.mappedRows}`);
    console.log(`Rows skipped (missing external ID): ${result.skippedRows}`);
    console.log(`Already in DB: ${result.updatedCount}`);
    console.log(`Imported successfully: ${result.insertedCount}`);
    console.log(`Processed unique rows: ${result.processedCount}`);
    console.log(`Source sync state: ${result.sourceSyncState}`);
  } finally {
    await app.close();
  }
}

main().catch(error => {
  console.error('Sales import CLI failed:', error);
  process.exit(1);
});

function parseArgs(argv: string[]): ImportCliOptions {
  const options: ImportCliOptions = {
    filePath: null,
    sourceSyncState: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];

    if (current === '--help' || current === '-h') {
      options.help = true;

      return options;
    }

    if (!current.startsWith('--') && !options.filePath) {
      options.filePath = current;
      continue;
    }

    if (current === '--file') {
      const value = argv[i + 1];

      if (value && !value.startsWith('--')) {
        options.filePath = value;
        i += 1;
      }

      continue;
    }

    if (current === '--source-sync-state') {
      const value = argv[i + 1];

      if (value && !value.startsWith('--')) {
        options.sourceSyncState = value;
        i += 1;
      }

      continue;
    }
  }

  return options;
}

function printUsage(): void {
  console.log(`
Usage:
  node dist/main-import.js --file <path> [--source-sync-state <value>]
  node dist/main-import.js <path> [--source-sync-state <value>]

Description:
  Import sales data from a MongoDB Compass backup JSON file into Postgres using repository upsert.
  `);
}
