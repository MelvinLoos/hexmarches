import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

// ─── Issue #44: WikiLink AST Resolution (E2E Enforced) ───────────
// Ironclad test: creates a wiki node with [[Test Link]] content,
// navigates to it, and asserts an <a> tag exists in the DOM with
// the correctly resolved ltree path, NOT raw :wiki-link text.

let adminClient: ReturnType<typeof createClient>
let testNodePath: string
let testLinkTitle: string

test.beforeAll(async () => {
  adminClient = createClient(SUPABASE_URL, SERVICE_KEY)

  // Create a target node that [[Test Link]] should resolve to
  testLinkTitle = 'Test Link Target'
  const { data: target } = await adminClient.from('wiki_nodes').insert({
    title: testLinkTitle,
    content: 'This is the target page.',
    path: 'campaign.test_target',
    entity_type: 'GENERAL',
  }).select('id').single()

  // Create a source node that references the target via [[wikilink]]
  testNodePath = 'campaign.test_source'
  await adminClient.from('wiki_nodes').insert({
    title: 'Test Source',
    content: `Check out [[${testLinkTitle}]] in the campaign.`,
    path: testNodePath,
    entity_type: 'GENERAL',
  })
})

test.afterAll(async () => {
  // Cleanup: delete by exact paths
  await adminClient.from('wiki_nodes').delete().eq('path', 'campaign.test_target')
  await adminClient.from('wiki_nodes').delete().eq('path', 'campaign.test_source')
})

test('[[wikilink]] renders as <a> href with resolved ltree path', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', err => consoleErrors.push(err.message))

  // Navigate to the source page
  await page.goto('/wiki/campaign/test_source')

  // Wait for the wiki page to render
  await page.waitForSelector('.wiki-article', { timeout: 15000 })

  // Get the rendered HTML content
  const articleContent = await page.locator('.wiki-article').innerHTML()

  // AC1: The literal MDC syntax string must NOT appear in the DOM
  expect(articleContent).not.toContain(':wiki-link{title="')

  // AC2: The literal raw [[ ]] brackets must NOT appear as raw text
  // (they should have been transformed)
  const rawHTML = await page.locator('.wiki-article').innerHTML()
  expect(rawHTML).not.toContain('[[' + testLinkTitle + ']]')

  // AC3: An <a> tag linking to the resolved ltree path must exist
  const resolvedHref = '/wiki/campaign/test_target'
  const link = page.locator(`a.wiki-link[href="${resolvedHref}"]`)
  await expect(link).toBeVisible({ timeout: 5000 })

  // AC4: The link text should be the target title
  await expect(link).toHaveText(testLinkTitle)

  // AC5: No console errors
  expect(consoleErrors).toHaveLength(0)
})
