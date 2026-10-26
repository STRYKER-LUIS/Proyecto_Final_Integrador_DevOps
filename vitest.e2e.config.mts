import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.e2e.spec.ts'],
    setupFiles: ['./tests/e2e/setup.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
