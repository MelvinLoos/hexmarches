// ─── Asset Upload Composable ──────────────────────────────────
// Wraps AssetService for use in Vue components.
// Handles file validation, upload state, and error handling.

import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import { AssetService } from '~/src/core/application/asset-service'
import { SupabaseStorageRepository } from '~/src/infrastructure/supabase/storage-repository'
import { createSupabaseAdapter } from '~/src/infrastructure/supabase/adapter'

export function useAssetUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const lastUploadedUrl = ref<string | null>(null)

  let _service: AssetService | null = null

  function getService(): AssetService {
    if (!_service) {
      const client = useSupabaseClient()
      const adapter = createSupabaseAdapter(client)
      const repo = new SupabaseStorageRepository(adapter)
      _service = new AssetService(repo)
    }
    return _service
  }

  /**
   * Upload an image file. Returns the CDN URL on success.
   * Only accepts image files; rejects non-image types.
   */
  async function uploadAsset(file: File): Promise<string> {
    error.value = null

    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.value = `Cannot upload "${file.name}": only image files are supported.`
      return Promise.reject(new Error(error.value))
    }

    uploading.value = true
    try {
      const service = getService()
      const url = await service.uploadAsset(file)
      lastUploadedUrl.value = url
      return url
    } catch (err: any) {
      error.value = err?.message || 'Upload failed'
      throw err
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    error,
    lastUploadedUrl,
    uploadAsset,
  }
}