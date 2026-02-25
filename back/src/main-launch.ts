import { loadEnvVars } from '../loadEnvVars';

loadEnvVars();

const appMode = process.env.APP_MODE || 'leader';

if (appMode === 'worker') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./worker-launch');
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./leader-launch');
}
