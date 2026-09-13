import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ITDconference/' : '/',
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));
