import { test, expect } from '@playwright/test'

// ─── Issue #19: Task 2 — Fix Wiki Root & Editor Routing ────────────────
// AC1: Navigate to /wiki → page loads successfully (200, not 404)
// AC2: Wiki page shows home/index state, not "Page Not Found"
// AC3: Click "Create this page" → lands on /dm/wiki/edit with editor visible
// AC4: No 404 errors in console

test('GET /wiki returns 200 with wiki home page', async ({ page }) => {
  const response = await page.goto('/wiki')
  expect(response?.status()).toBe(200)
})

test('/wiki shows Campaign Wiki home page', async ({ page }) => {
  await page.goto('/wiki')
  // Should show wiki home, not "Page Not Found"
  await expect(page.getByTestId('wiki-home')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('Campaign Wiki')).toBeVisible()
})

test('Create this page navigates to editor without 404', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', err => consoleErrors.push(err.message))

  await page.goto('/wiki')
  await expect(page.getByTestId('wiki-home')).toBeVisible({ timeout: 10000 })

  // Click the "Create a new page" link
  const createLink = page.getByRole('link', { name: /create/i }).first()
  await createLink.click()

  // Should land on the editor page
  await page.waitForURL('**/dm/wiki/edit', { timeout: 10000 })

  // CRITICAL: Assert the actual md-editor-v3 DOM is rendered (not just .page-title)
  // md-editor-v3 renders a .md-editor container with toolbar and textarea
  await expect(page.locator('.md-editor')).toBeVisible({ timeout: 15000 })

  // Verify the save button is also present (proves full component tree loaded)
  await expect(page.getByTestId('wiki-save')).toBeVisible({ timeout: 5000 })

  // No 404 or Vue Router errors
  const relevantErrors = consoleErrors.filter(e => e.includes('404') || e.includes('No match found'))
  expect(relevantErrors).toHaveLength(0)
})

test('/wiki/nonexistent shows not-found with create link', async ({ page }) => {
  await page.goto('/wiki/nonexistent/page')
  await expect(page.getByTestId('wiki-not-found')).toBeVisible({ timeout: 10000 })
  // The "Create this page" link should point to the editor with the correct path
  const link = page.getByTestId('wiki-not-found').getByRole('link', { name: /create/i })
  await expect(link).toBeVisible()
  const href = await link.getAttribute('href')
  expect(href).toContain('/dm/wiki/edit/nonexistent/page')
})