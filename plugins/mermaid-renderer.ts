// ─── Global MermaidRenderer Registration ─────────────────────────────
// MDC's MDCRenderer resolves custom component tags at runtime via
// vueResolveComponent(), which only works for globally registered
// components (not Nuxt auto-imports, which are compile-time only).
//
// This plugin registers MermaidRenderer globally so the rehype-mermaid
// plugin's output (<mermaid-renderer code="...">) resolves correctly.

import { defineNuxtPlugin } from '#app'
import MermaidRenderer from '~/components/content/MermaidRenderer.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('MermaidRenderer', MermaidRenderer)
})