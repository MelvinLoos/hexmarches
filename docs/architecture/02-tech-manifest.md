# Phase 2: Skill Implementation & Tech Stack Manifest

## 2.1 Open Agent Skills Mapping
* **Nuxt 3 & Vue 3 Composition API:** Utilizing `<script setup>`, composables, and server API routes (BFF pattern) for Contexts A and C[cite: 1].
* **TDD for Vue/Nuxt:** Writing isolated component and domain tests with `@vue/test-utils` and `@nuxt/test-utils` using `vitest` *strictly prior* to implementation.
* **Supabase Client SDK & Realtime:** Mocking and interacting with `@supabase/supabase-js` for Auth, CRUD operations, and WebSocket channel subscriptions[cite: 1].
* **Markdown AST Manipulation:** Extending `@nuxtjs/mdc` for custom Vue component hydration[cite: 1].
* **Canvas Graphics & Geometry:** Implementing 2D rendering and hex math via `vue-konva` and `honeycomb-grid`[cite: 1].

## 2.2 Strict Package Manifest
Agents are restricted to the following dependency matrix:
* **Core:** `nuxt` (v3.x), `vue` (v3.x), `@supabase/supabase-js`, `@nuxtjs/supabase`[cite: 1].
* **Content:** `@nuxtjs/mdc`, `md-editor-v3`[cite: 1].
* **VTT Graphics:** `konva`, `vue-konva`, `honeycomb-grid`[cite: 1].
* **Offline & Storage:** `idb`, `@vite-pwa/nuxt`.
* **Testing Infrastructure:** `vitest`, `@vue/test-utils`, `@nuxt/test-utils`, `msw`.