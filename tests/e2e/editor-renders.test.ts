import { test, expect } from '@playwright/test'

// ─── Hotfix #52: TipTap Editor fails to mount UI and content ────
// RED PHASE: This test MUST fail against the current implementation.
// It asserts the ProseMirror DOM is physically rendered and interactive.

const EDITOR_URL = '/dm/wiki/edit'

test('ProseMirror editor DOM is rendered on the wiki edit page', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', err => consoleErrors.push(err.message))

  await page.goto(EDITOR_URL)
  await page.waitForLoadState('networkidle')

  // ── Assertion 1: ProseMirror contenteditable exists ─────────────
  // TipTap renders a .ProseMirror div inside EditorContent.
  // This is the single most important check — if this fails,
  // the editor is not mounting at all.
  await expect(
    page.locator('.ProseMirror'),
  ).toBeAttached({ timeout: 15000 })

  // ── Assertion 2: The editor container is visible ────────────────
  await expect(page.getByTestId('tiptap-editor')).toBeVisible({ timeout: 5000 })

  // ── Assertion 3: Title input is present ─────────────────────────
  await expect(page.getByTestId('wiki-title')).toBeVisible()

  // ── Assertion 4: Save button is present ─────────────────────────
  await expect(page.getByTestId('wiki-save')).toBeVisible()

  // ── Assertion 5: Raw mode toggle exists ─────────────────────────
  await expect(page.getByTestId('raw-mode-toggle')).toBeVisible()

  // ── Assertion 6: No console errors from Vue/TipTap ──────────────
  const relevantErrors = consoleErrors.filter(e =>
    !e.includes('mermaid') && // known MDC init issue
    !e.includes('favicon')   // not relevant
  )
  if (relevantErrors.length > 0) {
    console.error('Console errors:', relevantErrors)
  }
  expect(relevantErrors).toHaveLength(0)
})

test('TipTap editor accepts text input and syncs with save', async ({ page }) => {
  await page.goto(EDITOR_URL)
  await page.waitForLoadState('networkidle')

  // Wait for the editor to be ready
  await expect(page.locator('.ProseMirror')).toBeAttached({ timeout: 15000 })

  // Fill title
  const titleInput = page.getByTestId('wiki-title')
  await titleInput.fill('Test Arbor')
  await expect(titleInput).toHaveValue('Test Arbor')

  // ── Type into the ProseMirror editor ─────────────────────────────
  const proseMirror = page.locator('.ProseMirror')
  await proseMirror.click()
  await proseMirror.type('# Hello World', { delay: 10 })
  await page.waitForTimeout(300)

  // The editor should contain the typed text in its HTML
  await expect(proseMirror).toContainText('Hello World')

  // Verify path preview auto-generates
  await expect(page.getByTestId('wiki-path-preview')).toBeVisible()
  await expect(page.getByTestId('wiki-path-preview')).toContainText('test_arbor')
})

test('Raw mode toggle switches between TipTap and textarea', async ({ page }) => {
  await page.goto(EDITOR_URL)
  await page.waitForLoadState('networkidle')

  // Wait for TipTap to mount
  await expect(page.locator('.ProseMirror')).toBeAttached({ timeout: 15000 })

  // Click raw mode toggle
  const rawToggle = page.getByTestId('raw-mode-toggle')
  await rawToggle.click()
  await page.waitForTimeout(300)

  // Textarea should now be visible, TipTap should be gone
  await expect(page.getByTestId('raw-markdown-textarea')).toBeVisible()
  await expect(page.locator('.ProseMirror')).not.toBeAttached()

  // Toggle back
  await rawToggle.click()
  await page.waitForTimeout(500)

  // TipTap should be back
  await expect(page.locator('.ProseMirror')).toBeAttached({ timeout: 10000 })
  await expect(page.getByTestId('raw-markdown-textarea')).not.toBeVisible()
})