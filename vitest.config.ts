import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'server/**/*.test.ts',
      'server/**/*.unit.test.ts',
      'server/**/*.integration.test.ts',
      'server/**/*.ai.test.ts',
      'server/**/*.e2e.test.ts',
    ],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'server/matching/**',
        'server/services/**',
        'server/agents/**',
        'server/utils/**',
        'server/controllers/**',
      ],
      exclude: ['server/db/**', 'server/queue/**', 'server/index.ts'],
    },
    reporters: ['verbose'],
    testTimeout: 15000,
    hookTimeout: 10000,
  },
});
