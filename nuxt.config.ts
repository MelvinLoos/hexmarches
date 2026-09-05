// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-09-05',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/mdc',
    '@vite-pwa/nuxt',
  ],
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