import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/database/**/*.db-spec.ts'],
    fileParallelism: false,
  },
});