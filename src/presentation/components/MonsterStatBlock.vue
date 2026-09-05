<template>
  <div class="monster-stat-block">
    <strong>{{ name }}</strong>
    HP:{{ hp }} AC:{{ ac }}
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  hp: number
  ac: number
}>()
</script>