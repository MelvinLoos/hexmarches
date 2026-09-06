// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-09-05',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/mdc',
    '@vite-pwa/nuxt',
  ],

  // ── Component auto-imports ─────────────────────────────────────────
  // Nuxt auto-scans components/ by default; we extend it to include
  // our Clean Architecture presentation layer under src/presentation/components.
  components: [
    { path: '~/src/presentation/components', pathPrefix: false },
    { path: '~/components', pathPrefix: false },
  ],

  // ── Runtime config (auto-injected by @nuxtjs/supabase from env) ──
  runtimeConfig: {
    supabase: {
      serviceKey: '',
    },
    public: {
      supabase: {},
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
    remarkPlugins: {
      'remark-wikilinks': {
        src: './src/presentation/markdown/remark-wikilinks',
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: ['md-editor-v3'],
    },
  },
})