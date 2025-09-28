import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // give more time in CI for network/socket tests
    testTimeout: 20000,
    globals: false,
    environment: 'node'
  }
})
