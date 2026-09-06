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
        // URL and key are injected by @nuxtjs/supabase module defaults
        // from process.env.SUPABASE_URL / SUPABASE_KEY
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

  vite: {
    optimizeDeps: {
      include: ['md-editor-v3'],
    },
  },
})