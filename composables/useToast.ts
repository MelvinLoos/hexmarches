// ─── Toast Composable ──────────────────────────────────────────────────
// Provides simple success/error toast notifications.
// Replaces the console.log in the save handler with visible UI feedback.

import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useToast() {
  function addToast(message: string, type: 'success' | 'error') {
    const id = nextId++
    toasts.value.push({ id, message, type })
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 4000)
  }

  function success(message: string) {
    addToast(message, 'success')
  }

  function error(message: string) {
    addToast(message, 'error')
  }

  return {
    toasts,
    success,
    error,
  }
}