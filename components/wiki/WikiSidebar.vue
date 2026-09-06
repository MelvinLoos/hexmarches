<template>
  <aside v-if="tree.length > 0" data-testid="wiki-sidebar" class="wiki-sidebar">
    <h3 class="sidebar-title">Wiki Pages</h3>
    <ul class="tree-root">
      <TreeNode
        v-for="node in tree"
        :key="node.node.id"
        :tree-node="node"
      />
    </ul>
  </aside>
  <aside v-else data-testid="wiki-sidebar" class="wiki-sidebar">
    <div data-testid="wiki-sidebar-empty" class="sidebar-empty">
      No wiki pages yet.
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WikiNode } from '~/src/core/domain/wiki-node'
import TreeNode from './TreeNode.vue'

export interface WikiTreeNode {
  node: WikiNode
  children: WikiTreeNode[]
}

const props = defineProps<{
  nodes: WikiNode[]
}>()

function buildTree(nodes: WikiNode[]): WikiTreeNode[] {
  const nodeMap = new Map<string, WikiTreeNode>()
  const roots: WikiTreeNode[] = []

  // Create tree node entries for every wiki node
  for (const node of nodes) {
    nodeMap.set(node.path, { node, children: [] })
  }

  // Attach children to their parents based on ltree path hierarchy
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.path)!
    const pathParts = node.path.split('.')
    if (pathParts.length > 1) {
      const parentPath = pathParts.slice(0, -1).join('.')
      const parent = nodeMap.get(parentPath)
      if (parent) {
        parent.children.push(treeNode)
      } else {
        // Parent not in the tree — treat as root
        roots.push(treeNode)
      }
    } else {
      // Single-segment path → root node
      roots.push(treeNode)
    }
  }

  // Sort roots and children alphabetically
  const sortNodes = (list: WikiTreeNode[]) => {
    list.sort((a, b) => a.node.title.localeCompare(b.node.title))
    for (const item of list) sortNodes(item.children)
  }
  sortNodes(roots)

  return roots
}

const tree = computed(() => buildTree(props.nodes))

function pathToUrl(ltreePath: string): string {
  return `/wiki/${ltreePath.replace(/\./g, '/')}`
}
</script>

<style scoped>
.wiki-sidebar {
  width: 260px;
  min-width: 260px;
  background: #16213e;
  border-right: 2px solid #0f3460;
  padding: 16px;
  overflow-y: auto;
  height: 100%;
}
.sidebar-title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #e94560;
  margin-bottom: 12px;
}
.tree-root {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar-empty {
  color: #666;
  font-size: 0.85rem;
  text-align: center;
  padding: 16px 0;
}
</style>