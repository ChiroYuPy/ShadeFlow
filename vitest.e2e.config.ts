import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Browser tests: they start the app and drive it in a real Chrome. Run with `npm run test:e2e`.
export default defineConfig({
  test: {
    include: ['e2e/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
