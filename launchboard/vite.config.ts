import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => ({
  base: loadEnv(mode, '.', 'VITE_').VITE_BASE_PATH || (command === 'build' ? '/ITDconference/' : '/'),
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
