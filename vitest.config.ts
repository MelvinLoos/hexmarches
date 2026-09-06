import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const rootDir = __dirname

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', 'dist'],
  },
  resolve: {
    alias: {
      '~': rootDir,
      '@': rootDir,
    },
  },
})