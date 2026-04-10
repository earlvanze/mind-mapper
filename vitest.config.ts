import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['e2e/**', '**/node_modules/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/vitest.setup.ts'],
    pool: 'threads',
    // Reduce from 600s to 120s — tests run in ~60s, plenty of buffer
    testTimeout: 120000,
  },
});
