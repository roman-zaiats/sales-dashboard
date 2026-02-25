import * as zod from 'zod';

import { parseEnv } from './shared/env/env.utils';

const BooleanLike = zod.preprocess(
  value => {
    if (typeof value === 'string') {
      const normalized = value.toLowerCase().trim();
      if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return true;
      }

      if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return false;
      }
    }

    return value;
  },
  zod.boolean(),
);

export const AppEnvironmentSchema = zod.object({
  PORT: zod.coerce.number().default(8000),
  NODE_ENV: zod.enum(['development', 'production', 'staging', 'test']).default('development'),
  API_PREFIX: zod.string().default('api/v1'),

  GRAPHQL_PLAYGROUND: BooleanLike.default(false),
  GRAPHQL_DEBUG: BooleanLike.default(false),
  GRAPHQL_INTROSPECTION: BooleanLike.default(false),
  GRAPHQL_PATH: zod.string().default('/graphql'),

  LOG_LEVEL: zod.enum(['verbose', 'debug', 'info', 'warn', 'error']).default('info'),
  LOG_FORMAT: zod.enum(['combined', 'json', 'simple']).default('combined'),

  MONGODB_URI: zod.string().optional(),
  SECRET_MONGODB_URI: zod.string().optional(),

  POSTGRES_URL: zod.string().optional(),
  SALES_DATABASE_URL: zod.string().default('postgresql://postgres:postgres@localhost:5432/sales'),
  SALES_DATABASE_SSL: BooleanLike.default(false),

  MONGO_INGESTION_DATABASE: zod.string().default('sales_source'),
  MONGO_INGESTION_COLLECTION: zod.string().default('sales'),
  MONGO_INGESTION_POLL_MS: zod.coerce.number().default(180000),
  MONGO_INGESTION_BATCH_SIZE: zod.coerce.number().default(250),

  SYNC_SOURCE_CURSOR_KEY: zod.string().default('mongodb:last_processed_created_at'),

  APP_MODE: zod.enum(['leader', 'worker']).default('leader'),
  WORKER_PORT: zod.coerce.number().default(8002),
}).refine(
  data => Boolean(data.MONGODB_URI) || Boolean(data.SECRET_MONGODB_URI) || Boolean(data.POSTGRES_URL),
  {
    message: 'Either MONGODB_URI, SECRET_MONGODB_URI or POSTGRES_URL must be provided',
  },
);

export const env = parseEnv(AppEnvironmentSchema);

export const getEnv = <K extends keyof typeof env>(key: K): (typeof env)[K] => env[key];
