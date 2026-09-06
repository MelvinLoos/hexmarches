<template>
  <div class="app-shell">
    <header class="app-header">
      <h1 class="app-title">HexMarches</h1>
      <nav class="app-nav">
        <span class="nav-item active">VTT</span>
        <span class="nav-item">Wiki</span>
        <span class="nav-item">Characters</span>
      </nav>
    </header>

    <main class="app-main">
      <VttCanvas
        :hex-radius="30"
        :grid-width="20"
        :grid-height="15"
      />
    </main>

    <footer class="app-footer">
      <span>HexMarches — Virtual Tabletop &amp; Campaign Manager</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import VttCanvas from './src/presentation/components/VttCanvas.vue'
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #__nuxt {
  height: 100%;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
}
</style>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #16213e;
  border-bottom: 2px solid #0f3460;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e94560;
  letter-spacing: 1px;
}

.app-nav {
  display: flex;
  gap: 16px;
}

.nav-item {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  color: #a0a0b0;
  transition: background 0.2s, color 0.2s;
}

.nav-item:hover {
  background: #0f3460;
  color: #e0e0e0;
}

.nav-item.active {
  background: #e94560;
  color: #fff;
}

.app-main {
  flex: 1;
  padding: 24px;
}

.app-footer {
  padding: 10px 24px;
  text-align: center;
  font-size: 0.8rem;
  color: #666;
  background: #16213e;
  border-top: 1px solid #0f3460;
}
</style>