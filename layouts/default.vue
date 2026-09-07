<template>
  <div class="app-shell">
    <header class="app-header">
      <NuxtLink to="/" class="app-title">HexMarches</NuxtLink>
      <nav class="app-nav">
        <NuxtLink to="/wiki" class="nav-item" active-class="active">
          Wiki
        </NuxtLink>
        <NuxtLink to="/dm" class="nav-item" active-class="active">
          GM Dashboard
        </NuxtLink>
      </nav>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <CommandPalette />

    <footer class="app-footer">
      <span>HexMarches — Virtual Tabletop &amp; Campaign Manager</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onErrorCaptured } from 'vue'

// Silence mermaid SVG NaN coordinate errors from md-editor-v3 initialization.
onErrorCaptured((err: unknown) => {
  if (err instanceof Error) {
    const msg = err.message
    if (
      msg.includes('Expected length, "NaN"') ||
      msg.includes('attribute x1') ||
      msg.includes('attribute x2')
    ) {
      return false // suppress
    }
  }
})
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #__nuxt {
  height: 100%;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
}
</style>

<style scoped>
.app-shell { display: flex; flex-direction: column; min-height: 100vh; }
.app-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 24px; background: #16213e; border-bottom: 2px solid #0f3460;
}
.app-title {
  font-size: 1.5rem; font-weight: 700; color: #e94560;
  letter-spacing: 1px; text-decoration: none;
}
.app-title:hover { color: #f75973; }
.app-nav { display: flex; gap: 16px; }
.nav-item {
  padding: 6px 14px; border-radius: 6px; font-size: 0.9rem;
  cursor: pointer; color: #a0a0b0;
  transition: background 0.2s, color 0.2s; text-decoration: none;
}
.nav-item:hover { background: #0f3460; color: #e0e0e0; }
.nav-item.active { background: #e94560; color: #fff; }
.app-main { flex: 1; padding: 24px; }
.app-footer {
  padding: 10px 24px; text-align: center; font-size: 0.8rem;
  color: #666; background: #16213e; border-top: 1px solid #0f3460;
}
</style>