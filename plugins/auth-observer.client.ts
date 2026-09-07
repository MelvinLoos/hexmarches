// ─── Auth Observer Plugin ──────────────────────────────────────────
// Watches useSupabaseUser() and sets useGmStatus based on auth state.
// Client-side only — runs in the Nuxt injection context so composables work.

export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { setGmStatus } = useGmStatus()

  watch(user, (newUser) => {
    setGmStatus(!!newUser)
  }, { immediate: true })
})
