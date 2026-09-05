// ─── Supabase Infrastructure Adapter ────────────────────────────────
// Thin wrapper around @supabase/supabase-js
// No domain logic — pure infrastructure concerns

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseAdapterConfig {
  supabaseUrl: string
  supabaseKey: string
}

export class SupabaseAdapter {
  public readonly url: string
  public readonly client: SupabaseClient

  constructor(config: SupabaseAdapterConfig) {
    this.url = config.supabaseUrl
    this.client = createClient(config.supabaseUrl, config.supabaseKey)
  }

  from(table: string) {
    return this.client.from(table)
  }

  channel(name: string) {
    return this.client.channel(name)
  }
}

export function createSupabaseAdapter(config: SupabaseAdapterConfig): SupabaseAdapter {
  return new SupabaseAdapter(config)
}