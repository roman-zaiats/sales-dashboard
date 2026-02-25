import { existsSync } from 'node:fs';

import { config as dotenvxConfig } from '@dotenvx/dotenvx';

export const loadEnvVars = () => {
  dotenvxConfig();

  const envFile = `.env.${process.env.NODE_ENV || 'development'}`;

  if (existsSync('.env')) {
    dotenvxConfig({ path: '.env', overload: true });
  }

  if (existsSync(envFile)) {
    dotenvxConfig({ path: envFile, overload: true });
  }

  if (existsSync('.env.local')) {
    dotenvxConfig({ path: '.env.local', overload: true });
  }
};
