// ─── Supabase Storage Repository ──────────────────────────────────
// Infrastructure adapter — implements AssetRepository using Supabase Storage
// Handles file uploads to the wiki-assets bucket.

import type { AssetRepository } from '~/src/core/domain/asset-repository'
import type { SupabaseAdapter } from './adapter'

export class SupabaseStorageRepository implements AssetRepository {
  private readonly adapter: SupabaseAdapter
  private readonly bucket = 'wiki-assets'

  constructor(adapter: SupabaseAdapter) {
    this.adapter = adapter
  }

  /**
   * Sanitize a file path for safe storage.
   * Replaces non-alphanumeric characters (except dots, slashes, hyphens, underscores)
   * to prevent broken URLs.
   */
  private sanitizePath(path: string): string {
    return path
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._\-/]/g, '_')
      .replace(/_+/g, '_')
  }

  async upload(file: File, path: string): Promise<string> {
    const safePath = this.sanitizePath(path)

    const { data, error } = await this.adapter.client.storage
      .from(this.bucket)
      .upload(safePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      throw new Error(`Failed to upload asset: ${error.message}`)
    }

    // Construct the public CDN URL
    const baseUrl = this.adapter.client.storage
      .from(this.bucket)
      .getPublicUrl(safePath).data.publicUrl

    return baseUrl
  }
}