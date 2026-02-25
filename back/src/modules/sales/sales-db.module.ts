import { Global, Module, type Provider } from '@nestjs/common';
import { Pool } from 'pg';

import { env } from '../../app.env';

export const SALES_PG_POOL = 'SALES_PG_POOL';

const salesDbProvider: Provider = {
  provide: SALES_PG_POOL,
  useFactory: () => {
    const connectionString = env.POSTGRES_URL || env.SALES_DATABASE_URL;
    const connectionHasSsl = (() => {
      try {
        const parsed = new URL(connectionString);

        return env.SALES_DATABASE_SSL || parsed.searchParams.get('sslmode')?.toLowerCase() === 'require';
      } catch {
        return env.SALES_DATABASE_SSL;
      }
    })();

    const pool = new Pool({
      connectionString,
      ssl: connectionHasSsl
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });

    return pool;
  },
};

@Global()
@Module({
  providers: [salesDbProvider],
  exports: [salesDbProvider],
})
export class SalesDbModule {}
