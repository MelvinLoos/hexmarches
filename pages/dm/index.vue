<template>
  <div class="dm-dashboard">
    <h1 class="dashboard-title">GM Dashboard</h1>
    <p class="dashboard-subtitle">Campaign management tools for the Game Master</p>

    <div class="dashboard-cards">
      <NuxtLink to="/dm/wiki/edit" class="dashboard-card">
        <h2>📝 Wiki Editor</h2>
        <p>Create and edit campaign wiki pages with Markdown and MDC components.</p>
      </NuxtLink>

      <div class="dashboard-card dashboard-card--disabled">
        <h2>🎭 Characters</h2>
        <p>Manage NPCs and player characters (coming soon).</p>
      </div>

      <div class="dashboard-card dashboard-card--disabled">
        <h2>🗺️ VTT Control</h2>
        <p>Manage virtual tabletop sessions (coming soon).</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dm-dashboard {
  padding: 24px;
  max-width: 900px;
}
.dashboard-title {
  color: #e94560;
  font-size: 1.75rem;
  margin-bottom: 8px;
}
.dashboard-subtitle {
  color: #888;
  margin-bottom: 32px;
}
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.dashboard-card {
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  padding: 20px;
  text-decoration: none;
  transition: border-color 0.2s, background 0.2s;
}
.dashboard-card:hover {
  border-color: #e94560;
  background: #1a2744;
}
.dashboard-card h2 {
  color: #e0e0e0;
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.dashboard-card p {
  color: #888;
  font-size: 0.85rem;
  line-height: 1.4;
}
.dashboard-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dashboard-card--disabled:hover {
  border-color: #0f3460;
  background: #16213e;
}
</style>