import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // give more time in CI for network/socket tests
    testTimeout: 20000,
    globals: false,
    environment: 'node',
    include: [
      'test/**/*.{test,spec}.{js,ts,tsx}',
      'packages/possibility/test/**/*.{test,spec}.{js,ts,tsx}'
    ],
    exclude: [
      'packages/visual-studio/**'
    ]
  }
})
