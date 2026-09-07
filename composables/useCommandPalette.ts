import { ref } from 'vue'

// Singleton state — shared across all consumers
const isOpen = ref(false)

export function useCommandPalette() {
  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggle() {
    isOpen.value = !isOpen.value
  }

  return { isOpen, open, close, toggle }
}
