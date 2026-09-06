// ─── Asset Service ────────────────────────────────────────────────
// Application layer — orchestrates asset uploads through the repository port.

import type { AssetRepository } from '~/src/core/domain/asset-repository'

export class AssetService {
  constructor(private readonly repo: AssetRepository) {}

  /**
   * Upload an asset file to storage.
   * If no path is provided, a unique path is generated using timestamp + original filename.
   *
   * @param file - The File to upload
   * @param path - Optional storage path; auto-generated if omitted
   * @returns The public CDN URL of the uploaded asset
   */
  async uploadAsset(file: File, path?: string): Promise<string> {
    const uploadPath = path ?? `uploads/${Date.now()}_${file.name}`
    return this.repo.upload(file, uploadPath)
  }
}