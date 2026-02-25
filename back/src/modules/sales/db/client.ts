import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../../../app.env';
import * as schema from './schema';

export type SalesDatabase = NodePgDatabase<typeof schema>;

export type SalesDatabaseContext = {
  db: SalesDatabase;
  pool: Pool;
};

const resolveSalesConnectionString = (): string => {
  return env.DATABASE_URL || env.POSTGRES_URL || env.SALES_DATABASE_URL;
};

const resolveSalesSsl = (connectionString: string): boolean => {
  try {
    const parsed = new URL(connectionString);

    return env.SALES_DATABASE_SSL || parsed.searchParams.get('sslmode')?.toLowerCase() === 'require';
  } catch {
    return env.SALES_DATABASE_SSL;
  }
};

export const createSalesDatabaseContext = (): SalesDatabaseContext => {
  const connectionString = resolveSalesConnectionString();
  const useSsl = resolveSalesSsl(connectionString);

  const pool = new Pool({
    connectionString,
    ssl: useSsl
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  });

  const db = drizzle(pool, {
    schema,
    logger: false,
  });

  return {
    pool,
    db,
  };
};
