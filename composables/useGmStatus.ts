// ─── GM Status Composable ──────────────────────────────────────────
// Provides reactive isGm state for asymmetric security components.
// Defaults to true until auth is fully wired — all users are effectively
// GMs in the current development state. The auth-observer plugin will
// override this based on actual Supabase auth state when login exists.

import { ref } from 'vue'

const isGm = ref(true)

export function useGmStatus() {
  /**
   * Set the GM status. Called after authentication or session check.
   */
  function setGmStatus(value: boolean) {
    isGm.value = value
  }

  return {
    isGm,
    setGmStatus,
  }
}
