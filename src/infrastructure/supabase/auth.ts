// ─── Auth Composable ────────────────────────────────────────────────
// Manages authentication state via Supabase adapter
// No domain logic — pure session management

import { ref, Ref } from 'vue'
import type { SupabaseAdapter } from './adapter'

export enum AuthState {
  LOADING = 'loading',
  UNAUTHENTICATED = 'unauthenticated',
  AUTHENTICATED = 'authenticated',
}

export interface AuthUser {
  id: string
  email: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: string
}

export function useAuth(adapter: SupabaseAdapter) {
  const state: Ref<AuthState> = ref(AuthState.UNAUTHENTICATED)
  const user: Ref<AuthUser | null> = ref(null)

  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    state.value = AuthState.LOADING

    const { data, error } = await adapter.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      state.value = AuthState.UNAUTHENTICATED
      return { success: false, error: error.message }
    }

    if (data?.user) {
      user.value = {
        id: data.user.id,
        email: data.user.email!,
      }
      state.value = AuthState.AUTHENTICATED
      return { success: true }
    }

    state.value = AuthState.UNAUTHENTICATED
    return { success: false, error: 'No user data returned' }
  }

  async function logout(): Promise<void> {
    await adapter.client.auth.signOut()
    user.value = null
    state.value = AuthState.UNAUTHENTICATED
  }

  async function checkSession(): Promise<void> {
    state.value = AuthState.LOADING

    const { data } = await adapter.client.auth.getSession()

    if (data?.session?.user) {
      user.value = {
        id: data.session.user.id,
        email: data.session.user.email!,
      }
      state.value = AuthState.AUTHENTICATED
    } else {
      user.value = null
      state.value = AuthState.UNAUTHENTICATED
    }
  }

  return {
    state,
    user,
    login,
    logout,
    checkSession,
  }
}