<template>
  <div class="gm-wiki-editor">
    <div class="editor-field">
      <label for="wiki-title">Title</label>
      <input
        id="wiki-title"
        v-model="title"
        data-testid="wiki-title"
        type="text"
        placeholder="Node Title"
      />
    </div>

    <div class="editor-field">
      <label for="wiki-parent">Parent Folder</label>
      <select
        id="wiki-parent"
        v-model="selectedParent"
        data-testid="wiki-parent"
      >
        <option value="">Root (no parent)</option>
        <option
          v-for="folder in folderOptions"
          :key="folder.path"
          :value="folder.path"
        >
          {{ folder.path }} — {{ folder.title }}
        </option>
      </select>
    </div>

    <div v-if="generatedPath" class="editor-field">
      <label>Path Preview</label>
      <span data-testid="wiki-path-preview" class="path-preview">{{ generatedPath }}</span>
    </div>

    <MdEditor v-model="content" theme="dark" language="en-US" preview-theme="github" />

    <button data-testid="wiki-save" class="save-button" @click="handleSave">Save</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import type { WikiNode } from '~/src/core/domain/wiki-node'
import { generateChildPath } from '~/src/core/domain/wiki-node'

const props = defineProps<{
  initialTitle?: string
  initialContent?: string
  initialPath?: string
  parentOptions?: WikiNode[]
}>()

const emit = defineEmits<{
  save: [payload: { title: string; content: string; path: string }]
}>()

const title = ref(props.initialTitle ?? '')
const content = ref(props.initialContent ?? '')

// Determine initial parent from initialPath
function extractParentPath(fullPath: string): string {
  if (!fullPath) return ''
  const parts = fullPath.split('.')
  if (parts.length <= 1) return ''
  return parts.slice(0, -1).join('.')
}

const selectedParent = ref(extractParentPath(props.initialPath ?? ''))

// Filter to only show folders (nodes that could logically be parents)
// In practice: nodes without path vs all nodes; for now show all since any can be a parent
const folderOptions = computed(() => {
  return props.parentOptions ?? []
})

// Auto-generate the ltree path from parent + title
const generatedPath = computed(() => {
  if (!title.value.trim()) return ''
  return generateChildPath(selectedParent.value, title.value)
})

function handleSave() {
  emit('save', {
    title: title.value,
    content: content.value,
    path: generatedPath.value || '',
  })
}
</script>

<style scoped>
.gm-wiki-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.editor-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.editor-field label {
  font-size: 0.8rem;
  color: #a0a0b0;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.editor-field input,
.editor-field select {
  padding: 8px 12px;
  background: #1a1a2e;
  border: 1px solid #0f3460;
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 0.95rem;
}
.editor-field input:focus,
.editor-field select:focus {
  outline: none;
  border-color: #e94560;
}
.path-preview {
  padding: 6px 12px;
  background: #0f3460;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #e94560;
}
.save-button {
  padding: 10px 20px;
  background: #e94560;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  align-self: flex-start;
}
.save-button:hover {
  background: #f75973;
}
</style>