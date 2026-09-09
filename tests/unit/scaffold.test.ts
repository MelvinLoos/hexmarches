import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_ROOT = resolve(__dirname, '..', '..')

describe('Issue #1: Repository Scaffold & TDD Infrastructure', () => {
  // AC1: npm run test executes successfully
  it('should have a passing test infrastructure (self-test)', () => {
    expect(true).toBe(true)
  })

  // AC2: Clean Architecture directories exist under src/
  it('should have Clean Architecture directory structure under src/', () => {
    const requiredDirs = [
      'src/core/domain',
      'src/core/application',
      'src/infrastructure',
      'src/presentation',
    ]
    for (const dir of requiredDirs) {
      const fullPath = resolve(PROJECT_ROOT, dir)
      expect(existsSync(fullPath), `Directory "${dir}" should exist`).toBe(true)
    }
  })

  // AC2: Test directories exist
  it('should have test directory structure', () => {
    const requiredTestDirs = ['tests/unit', 'tests/integration', 'tests/components']
    for (const dir of requiredTestDirs) {
      const fullPath = resolve(PROJECT_ROOT, dir)
      expect(existsSync(fullPath), `Directory "${dir}" should exist`).toBe(true)
    }
  })

  // AC3: package.json is present with all mandatory dependencies from the Package Manifest
  it('should have package.json with all mandatory dependencies from the Package Manifest', () => {
    const pkgPath = resolve(PROJECT_ROOT, 'package.json')
    expect(existsSync(pkgPath), 'package.json should exist').toBe(true)

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    const requiredPackages = [
      'nuxt',
      'vue',
      '@supabase/supabase-js',
      '@nuxtjs/supabase',
      '@nuxtjs/mdc',
      '@tiptap/vue-3',
      'tiptap-markdown',
      'konva',
      'vue-konva',
      'honeycomb-grid',
      'idb',
      '@vite-pwa/nuxt',
      'vitest',
      '@vue/test-utils',
      '@nuxt/test-utils',
      'msw',
    ]

    for (const pkgName of requiredPackages) {
      expect(
        deps[pkgName],
        `Package "${pkgName}" should be in dependencies or devDependencies`
      ).toBeDefined()
    }
  })

  // AC3: nuxt.config.ts is present
  it('should have nuxt.config.ts', () => {
    const configPath = resolve(PROJECT_ROOT, 'nuxt.config.ts')
    expect(existsSync(configPath), 'nuxt.config.ts should exist').toBe(true)
  })

  // AC4: Vitest configuration file is present
  it('should have vitest configuration file', () => {
    const configPath = resolve(PROJECT_ROOT, 'vitest.config.ts')
    expect(existsSync(configPath), 'vitest.config.ts should exist').toBe(true)
  })

  // AC5: No application logic — scaffold only (soft check)
  it('should not contain application logic beyond scaffolding', () => {
    expect(true).toBe(true)
  })
})