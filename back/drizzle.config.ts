import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/sales/db/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SALES_DATABASE_URL || '',
  },
});
