import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    include: ['tests/unit/**/*.test.ts'],
    reporters: process.env.CI ? ['default', 'json'] : ['default'],
    outputFile: {
      json: './test-results/unit-tests.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts'
      ]
    }
  }
});
