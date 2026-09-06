// ─── Wiki Service Composable ──────────────────────────────────────────
// Provides a singleton WikiService backed by the Supabase adapter.
// Injected via Nuxt's useSupabaseClient() for automatic env binding.

import { WikiService } from '~/src/core/application/wiki-service'
import { SupabaseWikiRepository } from '~/src/infrastructure/supabase/wiki-repository'
import { createSupabaseAdapter } from '~/src/infrastructure/supabase/adapter'

let _service: WikiService | null = null

export function useWikiService(): WikiService {
  if (!_service) {
    const client = useSupabaseClient()
    const adapter = createSupabaseAdapter(client)
    const repo = new SupabaseWikiRepository(adapter)
    _service = new WikiService(repo)
  }
  return _service
}