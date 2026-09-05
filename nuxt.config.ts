// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-09-05',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/mdc',
    '@vite-pwa/nuxt',
  ],

  // ── Runtime config (auto-injected by @nuxtjs/supabase from env) ──
  runtimeConfig: {
    supabase: {
      // Server-only: service role key for admin operations
      serviceKey: '',
    },
    public: {
      supabase: {
        // Exposed to client: URL and anon key
        url: '',
        key: '',
      },
    },
  },

  supabase: {
    redirect: false,
  },

  mdc: {
    components: {
      prose: true,
      map: {},
    },
  },
})