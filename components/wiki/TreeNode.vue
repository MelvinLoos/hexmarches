<template>
  <li :data-testid="hasChildren ? 'tree-node-folder' : 'tree-node-file'" class="tree-item">
    <div class="node-row">
      <button
        v-if="hasChildren"
        class="folder-toggle"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <span class="toggle-icon">{{ isOpen ? '▼' : '▶' }}</span>
      </button>
      <span v-else class="leaf-indent" />
      <NuxtLink
        :to="pathToUrl(treeNode.node.path)"
        class="node-link"
        :class="{ 'is-folder': hasChildren }"
      >
        {{ treeNode.node.title }}
      </NuxtLink>
    </div>
    <ul v-if="hasChildren && isOpen" class="tree-children">
      <TreeNode
        v-for="child in treeNode.children"
        :key="child.node.id"
        :tree-node="child"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { WikiTreeNode } from './WikiSidebar.vue'

const props = defineProps<{
  treeNode: WikiTreeNode
}>()

const isOpen = ref(true)
const hasChildren = computed(() => props.treeNode.children.length > 0)

function toggle() {
  isOpen.value = !isOpen.value
}

function pathToUrl(ltreePath: string): string {
  return `/wiki/${ltreePath.replace(/\./g, '/')}`
}
</script>

<style scoped>
.tree-item {
  list-style: none;
  margin: 0;
  padding: 0;
}
.node-row {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 0;
}
.folder-toggle {
  background: none;
  border: none;
  color: #a0a0b0;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 0.7rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}
.leaf-indent {
  width: 20px;
  flex-shrink: 0;
}
.toggle-icon {
  display: inline-block;
  transition: transform 0.15s;
}
.node-link {
  display: block;
  color: #a0a0b0;
  font-size: 0.82rem;
  text-decoration: none;
  transition: color 0.15s;
  padding: 2px 0;
}
.node-link.is-folder {
  font-weight: 600;
  color: #e0e0e0;
}
.node-link:hover {
  color: #e94560;
}
.tree-children {
  padding-left: 16px;
  margin: 0;
}
</style>