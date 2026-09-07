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
        :class="{ 'input-error': titleError }"
        @input="titleError = ''"
      />
      <span v-if="titleError" data-testid="wiki-title-error" class="field-error">{{ titleError }}</span>
    </div>

    <div class="editor-field">
      <label for="wiki-entity-type">Entity Type</label>
      <select
        id="wiki-entity-type"
        v-model="entityType"
        data-testid="wiki-entity-type"
      >
        <option
          v-for="t in entityTypeOptions"
          :key="t"
          :value="t"
        >
          {{ t }}
        </option>
      </select>
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

    <div class="editor-field">
      <label>Cover Image</label>
      <div
        data-testid="wiki-cover-dropzone"
        class="cover-dropzone"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleCoverDrop"
        :class="{ 'drop-active': dragOver }"
      >
        <input
          type="file"
          data-testid="wiki-cover-file"
          accept="image/*"
          class="cover-file-input"
          @change="handleCoverFileSelect"
        />
        <input
          id="wiki-cover-image"
          v-model="coverImageUrl"
          data-testid="wiki-cover-image"
          type="url"
          placeholder="Paste a URL, click to browse, or drag & drop an image"
          class="cover-image-input"
        />
        <span v-if="coverUploading" data-testid="wiki-cover-uploading" class="cover-uploading">Uploading...</span>
      </div>
      <img
        v-if="coverImageUrl"
        :src="coverImageUrl"
        alt="Cover preview"
        class="cover-preview"
        data-testid="wiki-cover-preview"
      />
    </div>

    <div class="editor-wrapper" @keydown="onEditorKeydown">
      <div class="editor-toolbar">
        <button
          data-testid="wiki-insert-link-btn"
          class="insert-link-btn"
          :class="{ active: showAutocomplete && insertMode }"
          title="Insert Wiki Link (Ctrl+Shift+K)"
          @click="toggleInsertLink"
        >
          🔗 Insert Wiki Link
        </button>
      </div>
      <MdEditor
        ref="editorRef"
        v-model="content"
        theme="dark"
        language="en-US"
        preview-theme="github"
        :markdown-it-config="configureMarkdownIt"
        @on-upload-img="handleUploadImage"
      />

      <!-- Wiki-Link Autocomplete Picklist -->
      <div
        v-if="showAutocomplete"
        ref="picklistRef"
        data-testid="wiki-autocomplete-picklist"
        class="autocomplete-picklist"
      >
        <input
          v-if="insertMode"
          v-model="autocompleteQuery"
          data-testid="autocomplete-search-input"
          type="text"
          placeholder="Search wiki pages..."
          class="autocomplete-search-input"
          autofocus
        />
        <div
          v-for="result in autocompleteResults"
          :key="result.node.id"
          data-testid="autocomplete-item"
          class="autocomplete-item"
          @mousedown.prevent="selectAutocompleteItem(result.node.title)"
        >
          <span class="autocomplete-title">{{ result.node.title }}</span>
          <span class="autocomplete-type">{{ result.node.entityType || 'GENERAL' }}</span>
        </div>
        <div v-if="autocompleteResults.length === 0 && autocompleteQuery" class="autocomplete-empty">
          No matching pages
        </div>
      </div>
    </div>

    <button data-testid="wiki-save" class="save-button" @click="handleSave">Save</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useDebounceFn, onClickOutside } from '@vueuse/core'
import { useWikiService } from '~/composables/useWikiService'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { markdownItWikiLinks } from '~/src/presentation/markdown/markdown-it-wikilinks'
import type { WikiNode } from '~/src/core/domain/wiki-node'
import { generateChildPath, WikiNodeType } from '~/src/core/domain/wiki-node'
import type { WikiNodeSearchResult } from '~/src/core/domain/wiki-repository'

const props = defineProps<{
  initialTitle?: string
  initialContent?: string
  initialPath?: string
  initialCoverImageUrl?: string
  initialEntityType?: string
  parentOptions?: WikiNode[]
}>()

const emit = defineEmits<{
  save: [payload: { title: string; content: string; path: string; coverImageUrl?: string; entityType?: string }]
  uploadImage: [file: File, callback: (url: string) => void]
}>()

const entityTypeOptions = Object.values(WikiNodeType)

const title = ref(props.initialTitle ?? '')
const content = ref(props.initialContent ?? '')
const coverImageUrl = ref(props.initialCoverImageUrl ?? '')
const entityType = ref(props.initialEntityType || WikiNodeType.GENERAL)
const titleError = ref('')
const dragOver = ref(false)
const coverUploading = ref(false)

// Determine initial parent from initialPath
function extractParentPath(fullPath: string): string {
  if (!fullPath) return ''
  const parts = fullPath.split('.')
  if (parts.length <= 1) return ''
  return parts.slice(0, -1).join('.')
}

// ── markdown-it preview config ─────────────────────────────────────
function configureMarkdownIt(md: any) {
  md.use(markdownItWikiLinks)
}

const selectedParent = ref(extractParentPath(props.initialPath ?? ''))

// ── Wiki-Link Autocomplete State ────────────────────────────────────
const wikiService = useWikiService()
const commandPalette = useCommandPalette()
const editorRef = ref<InstanceType<typeof MdEditor> | null>(null)
const showAutocomplete = ref(false)
const autocompleteQuery = ref('')
const autocompleteResults = ref<WikiNodeSearchResult[]>([])
const picklistRef = ref<HTMLElement | null>(null)
const insertMode = ref(false) // true = manual insertion via button, false = [[-triggered

// Regex to find an open [[ that hasn't been closed
const wikilinkOpenRe = /\[\[([^[\]]*)$/

// Extracts the query text after the last open [[
function extractAutocompleteQuery(text: string): string | null {
  const match = text.match(wikilinkOpenRe)
  return match ? match[1] : null
}

// Replace the open [[query with [[Title]] in the content,
// or insert at cursor when in manual insert-mode.
function injectWikilink(title: string) {
  if (insertMode.value) {
    // Manual insertion — use editor's insert() at cursor position
    const ed = editorRef.value
    if (ed && typeof (ed as any).insert === 'function') {
      (ed as any).insert((_selectedText: string) => ({
        targetValue: `[[${title}]]`,
        select: false,
      }))
    } else {
      // Fallback: append to end
      const sep = content.value && !content.value.endsWith('\n') ? ' ' : ''
      content.value = content.value + sep + `[[${title}]]`
    }
  } else {
    // [[-triggered — replace the open [[query with [[Title]]
    const match = content.value.match(wikilinkOpenRe)
    if (!match) return
    const before = content.value.slice(0, match.index!)
    const after = content.value.slice(match.index! + match[0].length)
    content.value = before + `[[${title}]]` + after
  }
  showAutocomplete.value = false
  insertMode.value = false
  autocompleteQuery.value = ''
  autocompleteResults.value = []
}

// Debounced search
const debouncedAutocomplete = useDebounceFn(async (query: string) => {
  try {
    // Empty query returns the most recent/available nodes (top 20)
    const searchQuery = query.trim() || ' '
    autocompleteResults.value = await wikiService.searchNodes(searchQuery, 8)
  } catch {
    autocompleteResults.value = []
  }
}, 300)

// Watch content changes for [[ pattern
watch(content, (val) => {
  if (insertMode.value) return // Skip [[ detection when in manual insert mode
  const query = extractAutocompleteQuery(val)
  if (query !== null) {
    showAutocomplete.value = true
    autocompleteQuery.value = query
    // Always search — empty query returns top nodes instead of nothing
    debouncedAutocomplete(query || '')
  } else {
    showAutocomplete.value = false
    autocompleteQuery.value = ''
    autocompleteResults.value = []
  }
}, { immediate: true })

// Watch autocompleteQuery changes in insert mode to trigger searches
watch(autocompleteQuery, (val) => {
  if (insertMode.value) {
    debouncedAutocomplete(val || '')
  }
})
onClickOutside(picklistRef, () => {
  showAutocomplete.value = false
})

// Register Ctrl+Shift+K shortcut inside the editor to open Command Palette
onMounted(() => {
  const ed = editorRef.value
  if (ed && typeof (ed as any).domEventHandlers === 'function') {
    (ed as any).domEventHandlers({
      keydown(event: KeyboardEvent) {
        if (event.ctrlKey && event.shiftKey && event.key === 'K') {
          event.preventDefault()
          commandPalette.open()
          return true
        }
      },
    })
  }
})
function onEditorKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && showAutocomplete.value) {
    showAutocomplete.value = false
    insertMode.value = false
    autocompleteQuery.value = ''
    autocompleteResults.value = []
  }
}

// Toggle manual insert-link picklist
function toggleInsertLink() {
  if (showAutocomplete.value && insertMode.value) {
    // Already showing in insert mode — close it
    showAutocomplete.value = false
    insertMode.value = false
    autocompleteResults.value = []
    return
  }
  insertMode.value = true
  showAutocomplete.value = true
  autocompleteQuery.value = ''
  autocompleteResults.value = []
  // Open with empty query to show all recent/available nodes
  debouncedAutocomplete('')
}

// Select an autocomplete item
function selectAutocompleteItem(title: string) {
  injectWikilink(title)
}

// Filter to only show folders (nodes that could logically be parents)
const folderOptions = computed(() => {
  return props.parentOptions ?? []
})

// Auto-generate the ltree path from parent + title
const generatedPath = computed(() => {
  if (!title.value.trim()) return ''
  return generateChildPath(selectedParent.value, title.value)
})

async function handleUploadImage(files: File[], callback: (urls: string[]) => void) {
  for (const file of files) {
    emit('uploadImage', file, (url: string) => {
      callback([url])
    })
  }
}

function handleCoverFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadCoverFile(file)
  input.value = ''
}

function handleCoverDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  uploadCoverFile(file)
}

function uploadCoverFile(file: File) {
  coverUploading.value = true
  emit('uploadImage', file, (url: string) => {
    coverImageUrl.value = url
    coverUploading.value = false
  })
}

function handleSave() {
  titleError.value = ''
  if (!title.value.trim()) {
    titleError.value = 'Title is required.'
    return
  }
  emit('save', {
    title: title.value,
    content: content.value,
    path: generatedPath.value || '',
    coverImageUrl: coverImageUrl.value || undefined,
    entityType: entityType.value as string,
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
.input-error {
  border-color: #c62828 !important;
}
.field-error {
  color: #c62828;
  font-size: 0.8rem;
  margin-top: 2px;
}
.path-preview {
  padding: 6px 12px;
  background: #0f3460;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #e94560;
}
.cover-dropzone {
  position: relative;
  border: 2px dashed #0f3460;
  border-radius: 6px;
  padding: 8px;
  transition: border-color 0.2s;
}
.cover-dropzone.drop-active {
  border-color: #e94560;
  background: rgba(233, 69, 96, 0.06);
}
.cover-file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.cover-image-input {
  width: 100%;
  border: none !important;
  background: transparent !important;
  padding: 4px 0 !important;
}
.cover-uploading {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #e94560;
}
.cover-preview {
  margin-top: 8px;
  max-width: 200px;
  max-height: 120px;
  border-radius: 6px;
  border: 1px solid #0f3460;
  object-fit: cover;
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

/* ── Editor Toolbar ──────────────────────────────────────────────── */
.editor-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.insert-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #0f3460;
  color: #a0a0b0;
  border: 1px solid #0f3460;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.insert-link-btn:hover {
  background: #1a5276;
  color: #e0e0e0;
}
.insert-link-btn.active {
  background: #e94560;
  color: #fff;
  border-color: #e94560;
}

/* ── Wiki-Link Autocomplete Styles ───────────────────────────────── */
.editor-wrapper {
  position: relative;
}
.autocomplete-picklist {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #1a1a2e;
  border: 1px solid #e94560;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}
.autocomplete-search-input {
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #0f3460;
  color: #e0e0e0;
  font-size: 0.85rem;
  outline: none;
}
.autocomplete-search-input::placeholder {
  color: #555;
}
.autocomplete-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.autocomplete-item:hover {
  background: rgba(233, 69, 96, 0.15);
}
.autocomplete-title {
  color: #e0e0e0;
  font-size: 0.85rem;
  font-weight: 600;
}
.autocomplete-type {
  color: #e94560;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.autocomplete-empty {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 0.8rem;
}
</style>