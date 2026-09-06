// ─── Supabase Infrastructure Adapter ────────────────────────────────
// Thin wrapper around @supabase/supabase-js
// No domain logic — pure infrastructure concerns

import type { SupabaseClient } from '@supabase/supabase-js'

export { SupabaseClient }

export class SupabaseAdapter {
  public readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  from(table: string) {
    return this.client.from(table)
  }

  channel(name: string) {
    return this.client.channel(name)
  }
}

export function createSupabaseAdapter(client: SupabaseClient): SupabaseAdapter {
  return new SupabaseAdapter(client)
}