import { test, expect } from '@playwright/test'

// ─── Issue #18: Task 1 — Playwright Smoke Test ─────────────────────────
// Verifies that the Playwright infrastructure is correctly configured
// and the Nuxt dev server is reachable.

test('Nuxt dev server returns 200 on root page', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
})

test('Root page loads and shows HexMarches title', async ({ page }) => {
  await page.goto('/')
  // Verify the app title and nav links are visible
  await expect(page.getByRole('link', { name: 'HexMarches' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('link', { name: 'Wiki' })).toBeVisible()
})