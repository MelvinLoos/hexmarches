// ─── Asset Repository Interface ────────────────────────────────────
// Domain-layer port — defines the contract for asset (file) storage.
// Infrastructure adapters implement this interface.

export interface AssetRepository {
  /**
   * Upload a file to storage and return its public CDN URL.
   * @param file - The File object to upload
   * @param path - The storage path within the bucket (e.g., "images/cover.png")
   * @returns The public CDN URL of the uploaded file
   */
  upload(file: File, path: string): Promise<string>
}