import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['e2e/**', '**/node_modules/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/vitest.setup.ts'],
    // Use forks pool for reliability — threads pool times out on worker startup
    // for certain test files on this machine.
    pool: 'forks',
    testTimeout: 120000,
  },
});
