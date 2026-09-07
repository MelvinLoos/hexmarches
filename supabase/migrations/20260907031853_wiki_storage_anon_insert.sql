-- Migration: wiki_storage_anon_insert
-- Allows anonymous users to upload to wiki-assets bucket (needed until auth is wired).
-- Drops the authenticated-only INSERT policy and recreates it with both anon and authenticated.

DROP POLICY IF EXISTS "wiki_assets_auth_insert" ON storage.objects;

CREATE POLICY "wiki_assets_anon_insert"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'wiki-assets');

-- Also allow anonymous updates and deletes for now (since we have no auth)
DROP POLICY IF EXISTS "wiki_assets_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "wiki_assets_auth_delete" ON storage.objects;

CREATE POLICY "wiki_assets_anon_update"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'wiki-assets');

CREATE POLICY "wiki_assets_anon_delete"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'wiki-assets');
