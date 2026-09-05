import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

const srcDir = resolve(__dirname, 'src')

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', 'dist'],
  },
  resolve: {
    alias: {
      '~': srcDir,
      '@': srcDir,
    },
  },
})