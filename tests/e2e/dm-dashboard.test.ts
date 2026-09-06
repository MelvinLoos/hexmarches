import { test, expect } from '@playwright/test'

// ─── Issue #20: Task 3 — Fix GM Dashboard Placeholder ─────────────────
// AC1: Click "GM Dashboard" nav link → page loads successfully (200, not 404)
// AC2: DM dashboard page shows a meaningful placeholder

test('GM Dashboard link navigates to a valid page', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'HexMarches' })).toBeVisible()

  // Click the GM Dashboard nav link
  await page.getByRole('link', { name: 'GM Dashboard' }).click()

  // Should land on /dm without a 404
  await page.waitForURL('**/dm', { timeout: 10000 })
  
  // Verify meaningful content is shown
  await expect(page.locator('.dm-dashboard')).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('heading', { name: 'GM Dashboard' })).toBeVisible()

  // No 404 or Vue Router errors
  const relevantErrors = consoleErrors.filter(e => e.includes('404') || e.includes('No match found'))
  expect(relevantErrors).toHaveLength(0)
})