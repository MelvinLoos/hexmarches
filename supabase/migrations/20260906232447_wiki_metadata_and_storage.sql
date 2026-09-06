-- Migration: wiki_metadata_and_storage
-- Adds entity_type and cover_image_url columns to wiki_nodes.
-- Creates the wiki-assets storage bucket with public read access.

-- ── Add Metadata Columns ───────────────────────────────────────────

ALTER TABLE public.wiki_nodes
  ADD COLUMN entity_type text,
  ADD COLUMN cover_image_url text;

-- ── Create wiki-assets Storage Bucket ──────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wiki-assets',
  'wiki-assets',
  true,
  52428800,  -- 50 MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ───────────────────────────────────────────

-- Allow public (anon) reads on all objects in wiki-assets bucket
CREATE POLICY "wiki_assets_public_read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'wiki-assets');

-- Allow authenticated users to upload to wiki-assets
CREATE POLICY "wiki_assets_auth_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wiki-assets');

-- Allow authenticated users to update their own uploads
CREATE POLICY "wiki_assets_auth_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wiki-assets');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "wiki_assets_auth_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'wiki-assets');
