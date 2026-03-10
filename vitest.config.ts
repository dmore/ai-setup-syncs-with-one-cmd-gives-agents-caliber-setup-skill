import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['src/test/**', 'src/bin.ts', 'src/cli.ts', 'src/commands/**', 'dist/**'],
    },
  },
});
