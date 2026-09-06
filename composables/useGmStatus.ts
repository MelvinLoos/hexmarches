// ─── GM Status Composable ──────────────────────────────────────────
// Provides reactive isGm state for asymmetric security components.
// In production, this would derive from Supabase user metadata/app_metadata.

import { ref } from 'vue'

const isGm = ref(false)

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