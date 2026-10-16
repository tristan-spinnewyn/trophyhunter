import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'lcov'],
      include: ['lib/**/*.{ts,tsx}', 'app/api/**/*.{ts,tsx}'],
      exclude: [
        '**/__tests__/**',
        'lib/types.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
