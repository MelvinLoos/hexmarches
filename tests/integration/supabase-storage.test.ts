import { describe, it, expect, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdapter, SupabaseAdapter } from '~/src/infrastructure/supabase/adapter'
import { SupabaseStorageRepository } from '~/src/infrastructure/supabase/storage-repository'
import { AssetService } from '~/src/core/application/asset-service'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

describe('Issue #27: Infrastructure — Supabase Asset Storage Adapter', () => {
  describe('SupabaseStorageRepository', () => {
    it('should upload to wiki-assets and return correct public URL', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: { Id: '123', Key: 'images/test.png' }, error: null })
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/wiki-assets/images/test.png` } })
      const mockFrom = vi.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }))
      const mockClient = { storage: { from: mockFrom } } as any
      const adapter = new SupabaseAdapter(mockClient)
      const repo = new SupabaseStorageRepository(adapter)
      const testFile = makeFile('test.png', 'image-data', 'image/png')

      const url = await repo.upload(testFile, 'images/test.png')

      expect(mockFrom).toHaveBeenCalledWith('wiki-assets')
      expect(mockUpload).toHaveBeenCalledWith('images/test.png', testFile, expect.objectContaining({ upsert: true }))
      expect(url).toBe(`${SUPABASE_URL}/storage/v1/object/public/wiki-assets/images/test.png`)
    })

    it('should throw on upload failure', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: null, error: { message: 'Bucket not found' } })
      const mockFrom = vi.fn(() => ({ upload: mockUpload }))
      const mockClient = { storage: { from: mockFrom } } as any
      const adapter = new SupabaseAdapter(mockClient)
      const repo = new SupabaseStorageRepository(adapter)
      const testFile = makeFile('test.png', 'data', 'image/png')

      await expect(repo.upload(testFile, 'images/test.png')).rejects.toThrow('Failed to upload asset')
    })

    it('should sanitize file paths with special characters', async () => {
      const mockUpload = vi.fn().mockResolvedValue({ data: { Id: '1', Key: 'images/my_test_file_.jpg' }, error: null })
      const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: `${SUPABASE_URL}/storage/v1/object/public/wiki-assets/images/my_test_file_.jpg` } })
      const mockFrom = vi.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }))
      const mockClient = { storage: { from: mockFrom } } as any
      const adapter = new SupabaseAdapter(mockClient)
      const repo = new SupabaseStorageRepository(adapter)

      const testFile = makeFile('test.jpg', 'data', 'image/jpeg')
      const url = await repo.upload(testFile, 'images/my test file!.jpg')

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^images\/my_test_file_\.jpg$/),
        testFile,
        expect.any(Object)
      )
      expect(url).toContain('wiki-assets')
    })

    it('should reject uploads without auth (real RLS test)', async () => {
      const anonClient = createClient(SUPABASE_URL, ANON_KEY)
      const anonAdapter = createSupabaseAdapter(anonClient)
      const anonRepo = new SupabaseStorageRepository(anonAdapter)
      const testFile = makeFile('test.png', 'data', 'image/png')

      await expect(anonRepo.upload(testFile, 'images/test.png')).rejects.toThrow()
    })
  })

  describe('AssetService', () => {
    it('should delegate upload to the repository and return the URL', async () => {
      const mockRepo = {
        upload: vi.fn().mockResolvedValue(`${SUPABASE_URL}/storage/v1/object/public/wiki-assets/img.png`),
      }
      const service = new AssetService(mockRepo)
      const file = makeFile('img.png', 'abc', 'image/png')
      const url = await service.uploadAsset(file, 'img.png')
      expect(mockRepo.upload).toHaveBeenCalledWith(file, 'img.png')
      expect(url).toContain('wiki-assets')
    })

    it('should generate a unique path when no path is provided', async () => {
      const mockRepo = { upload: vi.fn().mockResolvedValue('https://cdn/123.png') }
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
