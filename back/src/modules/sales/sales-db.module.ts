import { randomUUID } from 'node:crypto';

import { Global, Inject, Logger, Module, type OnModuleInit, type Provider } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';

import type { SalesDatabaseContext } from './db/client';
import { getSalesDatabaseContext } from './db/connection';
import { users } from './db/schema';
import { salesSchemaSql } from './sales-schema';

export const SALES_PG_POOL = 'SALES_PG_POOL';
export const SALES_DB_CONTEXT = 'SALES_DB_CONTEXT';

const salesDbProvider: Provider = {
  provide: SALES_PG_POOL,
  useFactory: () => {
    return getSalesDatabaseContext().pool;
  },
};

const salesDbContextProvider: Provider = {
  provide: SALES_DB_CONTEXT,
  useFactory: () => getSalesDatabaseContext(),
};

@Global()
@Module({
  providers: [salesDbProvider, salesDbContextProvider],
  exports: [salesDbProvider, salesDbContextProvider],
})
export class SalesDbModule implements OnModuleInit {
  private readonly logger = new Logger(SalesDbModule.name);

  constructor(
    @Inject(SALES_DB_CONTEXT)
    private readonly salesDatabaseContext: SalesDatabaseContext,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.salesDatabaseContext.pool.query(salesSchemaSql);
    await this.verifyTables();
    await this.ensureSeedUser();

    this.logger.debug('Sales database is initialized with required tables');
  }

  private async verifyTables(): Promise<void> {
    const requiredTables = [
      'sales',
      'tags',
      'sale_tags',
      'sale_comments',
      'users',
      'ingestion_state',
      'sale_ingestion_runs',
    ];

    const rows = await this.salesDatabaseContext.pool.query(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY(ARRAY['sales','tags','sale_tags','sale_comments','users','ingestion_state','sale_ingestion_runs'])
      `,
    );

    const existing = new Set((rows.rows ?? []).map((row: { table_name: string }) => row.table_name));
    const missingTables = requiredTables.filter(tableName => !existing.has(tableName));

    if (missingTables.length > 0) {
      throw new Error(`Missing required sales tables: ${missingTables.join(', ')}`);
    }
  }

  private async ensureSeedUser(): Promise<void> {
    const [row] = await this.salesDatabaseContext.db
      .select({ count: count() })
      .from(users)
      .where(eq(users.authSub, 'seed-system-operator'))
      .limit(1);

    if (Number(row?.count ?? 0) > 0) {
      return;
    }

    await this.salesDatabaseContext.db.insert(users).values({
      id: randomUUID(),
      authSub: 'seed-system-operator',
      firstName: 'System',
      lastName: 'Operator',
    });
  }
}
