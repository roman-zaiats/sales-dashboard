import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const resolveFrontendPort = (mode: string) => {
  const localEnv = loadEnv(mode, process.cwd(), '');
  const rawPort = localEnv.VITE_FRONTEND_PORT || process.env.VITE_FRONTEND_PORT;

  const parsedPort = Number.parseInt(rawPort || '', 10);
  if (Number.isNaN(parsedPort) || parsedPort <= 0) {
    return 5173;
  }

  return parsedPort;
};

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: resolveFrontendPort(mode),
  },
}));
