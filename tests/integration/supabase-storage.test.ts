import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdapter } from '~/src/infrastructure/supabase/adapter'
import { SupabaseStorageRepository } from '~/src/infrastructure/supabase/storage-repository'
import { AssetService } from '~/src/core/application/asset-service'

// ─── Issue #27: Task 2 — Supabase Asset Storage Adapter ────────────
// Upload File objects to the wiki-assets bucket and return public CDN URLs.

const SUPABASE_URL = 'http://localhost:54321'
const SUPABASE_KEY = 'test-anon-key'

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function makeStorageRepository(): SupabaseStorageRepository {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY)
  const adapter = createSupabaseAdapter(client)
  return new SupabaseStorageRepository(adapter)
}

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

describe('Issue #27: Infrastructure — Supabase Asset Storage Adapter', () => {
  // ─── Storage Repository ───────────────────────────────────────────
  describe('SupabaseStorageRepository', () => {
    it('should upload a file to wiki-assets bucket and return a CDN URL', async () => {
      const testFile = makeFile('test.png', 'fake-image-data', 'image/png')

      server.use(
        http.post(
          `${SUPABASE_URL}/storage/v1/object/wiki-assets/*`,
          async ({ request }) => {
            const url = new URL(request.url)
            expect(url.pathname).toContain('wiki-assets')
            return HttpResponse.json(
              { Id: '12345', Key: 'images/test.png', KeyMetadata: {} },
              { status: 200 }
            )
          }
        )
      )

      const repo = makeStorageRepository()
      const url = await repo.upload(testFile, 'images/test.png')

      expect(url).toBe(
        `${SUPABASE_URL}/storage/v1/object/public/wiki-assets/images/test.png`
      )
    })

    it('should throw when the upload fails', async () => {
      const testFile = makeFile('test.png', 'data', 'image/png')

      server.use(
        http.post(
          `${SUPABASE_URL}/storage/v1/object/wiki-assets/*`,
          () => HttpResponse.json({ message: 'Bucket not found' }, { status: 404 })
        )
      )

      const repo = makeStorageRepository()
      await expect(repo.upload(testFile, 'images/test.png')).rejects.toThrow(
        'Failed to upload asset'
      )
    })

    it('should sanitize file paths with special characters', async () => {
      const testFile = makeFile('test.jpg', 'data', 'image/jpeg')

      server.use(
        http.post(
          `${SUPABASE_URL}/storage/v1/object/wiki-assets/*`,
          async ({ request }) => {
            const url = new URL(request.url)
            expect(url.pathname).not.toContain(' ')
            expect(url.pathname).not.toContain('!')
            return HttpResponse.json({ Id: '1', Key: 'test.jpg' }, { status: 200 })
          }
        )
      )

      const repo = makeStorageRepository()
      const url = await repo.upload(testFile, 'images/my test file!.jpg')
      expect(url).toContain('wiki-assets')
    })
  })

  // ─── Asset Service ────────────────────────────────────────────────
  describe('AssetService', () => {
    it('should delegate upload to the repository and return the URL', async () => {
      const mockRepo = {
        upload: vi.fn().mockResolvedValue(
          `${SUPABASE_URL}/storage/v1/object/public/wiki-assets/img.png`
        ),
      }
      const service = new AssetService(mockRepo)
      const file = makeFile('img.png', 'abc', 'image/png')
      const url = await service.uploadAsset(file, 'img.png')

      expect(mockRepo.upload).toHaveBeenCalledWith(file, 'img.png')
      expect(url).toContain('wiki-assets')
    })

    it('should generate a unique path when no path is provided', async () => {
      const mockRepo = {
        upload: vi.fn().mockResolvedValue('https://cdn/123.png'),
      }
      const service = new AssetService(mockRepo)
      const file = makeFile('test.png', 'data', 'image/png')
      const url = await service.uploadAsset(file)

      expect(mockRepo.upload).toHaveBeenCalled()
      const calledPath = mockRepo.upload.mock.calls[0][1]
      expect(calledPath).toMatch(/\.png$/)
      expect(url).toBe('https://cdn/123.png')
    })
  })
})