import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseAdapter, SupabaseAdapter } from '~/infrastructure/supabase/adapter'
import { useAuth, AuthState } from '~/infrastructure/supabase/auth'

// Mock @supabase/supabase-js to avoid real network calls
// (the adapter no longer calls createClient itself,
// but the mock is kept in case other modules use it)
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn() })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({ subscribe: vi.fn() })),
  })),
}

describe('Issue #4: Infrastructure — Supabase Adapters & Auth', () => {
  let adapter: SupabaseAdapter

  beforeEach(() => {
    adapter = createSupabaseAdapter(mockSupabase as any)
  })

  // ─── Adapter Initialization ──────────────────────────────────────
  describe('SupabaseAdapter', () => {
    it('should create an adapter with a SupabaseClient', () => {
      expect(adapter).toBeDefined()
      expect(adapter.client).toBe(mockSupabase)
    })

    it('should expose the supabase client', () => {
      expect(adapter.client).toBeDefined()
      expect(adapter.client.auth).toBeDefined()
    })

    it('should provide a database query builder', () => {
      const query = adapter.from('characters')
      expect(query).toBeDefined()
      expect(query.select).toBeDefined()
      expect(query.insert).toBeDefined()
    })

    it('should provide a realtime channel factory', () => {
      const channel = adapter.channel('test-room')
      expect(channel).toBeDefined()
    })
  })

  // ─── Auth Composable ─────────────────────────────────────────────
  describe('useAuth()', () => {
    it('should start with an unauthenticated state', () => {
      const auth = useAuth(adapter)
      expect(auth.state.value).toBe(AuthState.UNAUTHENTICATED)
      expect(auth.user.value).toBeNull()
    })

    it('should login and set authenticated state', async () => {
      const mockSession = {
        user: { id: 'user-1', email: 'gm@test.com' },
        session: { access_token: 'token-abc' },
      }
      adapter.client.auth.getSession.mockResolvedValue({
        data: { session: mockSession.session },
        error: null,
      })
      adapter.client.auth.signInWithPassword.mockResolvedValue({
        data: mockSession,
        error: null,
      })

      const auth = useAuth(adapter)
      const result = await auth.login({
        email: 'gm@test.com',
        password: 'secret123',
      })

      expect(result.success).toBe(true)
      expect(auth.state.value).toBe(AuthState.AUTHENTICATED)
      expect(auth.user.value?.email).toBe('gm@test.com')
    })

    it('should return error on failed login', async () => {
      adapter.client.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      const auth = useAuth(adapter)
      const result = await auth.login({
        email: 'bad@test.com',
        password: 'wrong',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(auth.state.value).toBe(AuthState.UNAUTHENTICATED)
    })

    it('should logout and clear state', async () => {
      adapter.client.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'x' } },
        error: null,
      })
      adapter.client.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'u1', email: 'gm@test.com' }, session: { access_token: 'x' } },
        error: null,
      })
      adapter.client.auth.signOut.mockResolvedValue({ error: null })

      const auth = useAuth(adapter)
      await auth.login({ email: 'gm@test.com', password: 'secret' })

      await auth.logout()
      expect(auth.state.value).toBe(AuthState.UNAUTHENTICATED)
      expect(auth.user.value).toBeNull()
    })

    it('should check existing session on init', async () => {
      adapter.client.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'existing', email: 'existing@test.com' },
            access_token: 'existing-token',
          },
        },
        error: null,
      })

      const auth = useAuth(adapter)
      await auth.checkSession()

      expect(auth.state.value).toBe(AuthState.AUTHENTICATED)
      expect(auth.user.value?.id).toBe('existing')
    })
  })

  // ─── Clean Architecture Enforcement ──────────────────────────────
  describe('Clean Architecture compliance', () => {
    it('should keep domain logic out of infrastructure layer', () => {
      // The adapter should only deal with Supabase client concerns
      // No tier calculation, no hex math, no milestone logic
      expect(typeof adapter.from).toBe('function')
      expect(typeof adapter.channel).toBe('function')

      // Verify the adapter only depends on supabase client, not domain code
      const adapterStr = createSupabaseAdapter.toString()
      expect(adapterStr).not.toContain('calculateTier')
      expect(adapterStr).not.toContain('hexDistance')
    })

    it('auth composable should not contain domain business rules', () => {
      // Auth only manages session state, not game logic
      const auth = useAuth(adapter)
      expect('login' in auth).toBe(true)
      expect('logout' in auth).toBe(true)
      // No domain methods leaked
      expect('calculateTier' in auth).toBe(false)
      expect('addMilestone' in auth).toBe(false)
    })
  })
})