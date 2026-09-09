<template>
  <div class="gm-wiki-editor">
    <!-- Title -->
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

    <!-- Entity Type -->
    <div class="editor-field">
      <label for="wiki-entity-type">Entity Type</label>
      <select id="wiki-entity-type" v-model="entityType" data-testid="wiki-entity-type">
        <option v-for="t in entityTypeOptions" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Parent Folder -->
    <div class="editor-field">
      <label for="wiki-parent">Parent Folder</label>
      <select id="wiki-parent" v-model="selectedParent" data-testid="wiki-parent">
        <option value="">Root (no parent)</option>
        <option v-for="folder in folderOptions" :key="folder.path" :value="folder.path">
          {{ folder.path }} \u2014 {{ folder.title }}
        </option>
      </select>
    </div>

    <!-- Path Preview -->
    <div v-if="generatedPath" class="editor-field">
      <label>Path Preview</label>
      <span data-testid="wiki-path-preview" class="path-preview">{{ generatedPath }}</span>
    </div>

    <!-- Cover Image -->
    <div class="editor-field">
      <label>Cover Image</label>
      <div
        data-testid="wiki-cover-dropzone"
        class="cover-dropzone"
        :class="{ 'drop-active': dragOver }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleCoverDrop"
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

    <!-- Raw Mode Toggle -->
    <div class="editor-field">
      <button
        data-testid="raw-mode-toggle"
        type="button"
        class="raw-mode-toggle"
        @click="toggleRawMode"
      >
        {{ isRawMode ? 'Switch to WYSIWYG' : 'Switch to Raw Markdown' }}
      </button>
    </div>

    <!-- Editor: WYSIWYG (TipTap) or Raw (textarea) -->
    <div v-if="!isRawMode && editor" data-testid="tiptap-editor" class="editor-wrapper tiptap-editor-wrapper">
      <EditorBubble v-if="editor" :editor="editor" />
      <EditorSlash v-if="editor" :editor="editor" />
      <EditorContent :editor="editor" class="tiptap-content" />
      <!-- Wiki-Link Autocomplete Picklist -->
      <div v-if="showAutocomplete" data-testid="autocomplete-overlay" class="autocomplete-overlay">
        <div data-testid="autocomplete-backdrop" class="autocomplete-backdrop" @click="closeAutocomplete" />
        <div ref="picklistRef" data-testid="wiki-autocomplete-picklist" class="autocomplete-picklist">
          <input
            v-if="insertMode"
            v-model="autocompleteQuery"
            data-testid="autocomplete-search-input"
            type="text"
            placeholder="Search wiki nodes..."
            class="autocomplete-search-input"
          />
          <div
            v-for="result in autocompleteResults"
            :key="result.id"
            class="autocomplete-item"
            data-testid="autocomplete-item"
            @click="selectAutocompleteItem(result.title)"
          >
            <span class="autocomplete-title">{{ result.title }}</span>
            <span class="autocomplete-type">{{ result.entityType || 'GENERAL' }}</span>
          </div>
          <div v-if="autocompleteResults.length === 0" class="autocomplete-empty">No matching nodes found</div>
        </div>
      </div>
    </div>

    <div v-else class="editor-wrapper raw-editor-wrapper">
      <textarea
        v-model="rawMarkdown"
        data-testid="raw-markdown-textarea"
        class="raw-markdown-textarea"
        placeholder="Enter raw markdown..."
      />
    </div>

    <!-- Save -->
    <button data-testid="wiki-save" class="save-button" @click="handleSave">
      Save
    </button>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, shallowRef } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import { useDebounceFn, onClickOutside } from '@vueuse/core'
import { useWikiService } from '~/composables/useWikiService'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { createEditor } from '~/src/presentation/tiptap/editor-setup'
import EditorBubble from "~/src/presentation/components/editor/EditorBubble.vue"
import EditorSlash from "~/src/presentation/components/editor/EditorSlash.vue"
import type { Editor } from '@tiptap/core'
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

// ── Form state ──────────────────────────────────────────────────
const title = ref(props.initialTitle ?? '')
const coverImageUrl = ref(props.initialCoverImageUrl ?? '')
const entityType = ref(props.initialEntityType || WikiNodeType.GENERAL)
const titleError = ref('')
const dragOver = ref(false)
const coverUploading = ref(false)
const selectedParent = ref(extractParentPath(props.initialPath ?? ''))

// ── Raw mode ────────────────────────────────────────────────────
const isRawMode = ref(false)
const rawMarkdown = ref(props.initialContent ?? '')
const currentMarkdown = ref(props.initialContent ?? '')

// ── TipTap editor ───────────────────────────────────────────────
const editor = shallowRef<Editor | null>(null)

function initEditor(content: string) {
  if (editor.value) {
    editor.value.destroy()
    editor.value = null
  }
  const ed = createEditor({
    content,
    onUpdate: (md: string) => {
      currentMarkdown.value = md
    },
  })
  editor.value = ed
}

// Initial creation
initEditor(props.initialContent ?? '')

// Cleanup on unmount
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// ── Wiki-Link Autocomplete State ────────────────────────────────
const wikiService = useWikiService()
const commandPalette = useCommandPalette()
const showAutocomplete = ref(false)
const autocompleteQuery = ref('')
const autocompleteResults = ref<WikiNodeSearchResult[]>([])
const picklistRef = ref<HTMLElement | null>(null)
const insertMode = ref(false)

const wikilinkOpenRe = /\[\[([^[\]]*)$/

function extractAutocompleteQuery(text: string): string | null {
  const match = text.match(wikilinkOpenRe)
  return match ? match[1] : null
}

function injectWikilink(title: string) {
  if (insertMode.value) {
    const ed = editor.value
    if (ed) {
      ed.commands.insertContent(`[[${title}]]`)
    } else {
      const sep = currentMarkdown.value && !currentMarkdown.value.endsWith('\\n') ? ' ' : ''
      currentMarkdown.value = currentMarkdown.value + sep + `[[${title}]]`
    }
  } else {
    const match = currentMarkdown.value.match(wikilinkOpenRe)
    if (!match) return
    const before = currentMarkdown.value.slice(0, match.index!)
    const after = currentMarkdown.value.slice(match.index! + match[0].length)
    currentMarkdown.value = before + `[[${title}]]` + after
  }
  closeAutocomplete()
}

const debouncedAutocomplete = useDebounceFn(async (query: string) => {
  try {
    const searchQuery = query.trim() || ' '
    autocompleteResults.value = await wikiService.searchNodes(searchQuery, 8)
  } catch {
    autocompleteResults.value = []
  }
}, 300)

watch(currentMarkdown, (val) => {
  if (insertMode.value) return
  const query = extractAutocompleteQuery(val)
  if (query !== null) {
    showAutocomplete.value = true
    autocompleteQuery.value = query
    debouncedAutocomplete(query || '')
  } else {
    closeAutocomplete()
  }
}, { immediate: true })

watch(autocompleteQuery, (val) => {
  if (insertMode.value) debouncedAutocomplete(val || '')
})

function closeAutocomplete() {
  showAutocomplete.value = false
  insertMode.value = false
  autocompleteQuery.value = ''
  autocompleteResults.value = []
}

onClickOutside(picklistRef, () => closeAutocomplete())

onMounted(() => {
  if (editor.value) {
    editor.value.on('keydown', ({ event }: { event: KeyboardEvent }) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
        event.preventDefault()
        commandPalette.open()
      }
    })
  }
})

function toggleInsertLink() {
  if (showAutocomplete.value && insertMode.value) {
    closeAutocomplete()
    return
  }
  insertMode.value = true
  showAutocomplete.value = true
  autocompleteQuery.value = ''
  autocompleteResults.value = []
  debouncedAutocomplete('')
  nextTick(() => {
    const input = document.querySelector('[data-testid="autocomplete-search-input"]') as HTMLInputElement | null
    input?.focus()
  })
}

function selectAutocompleteItem(title: string) {
  injectWikilink(title)
}

// ── Folder / Path logic ─────────────────────────────────────────
const folderOptions = computed(() => props.parentOptions ?? [])

const generatedPath = computed(() => {
  if (!title.value.trim()) return ''
  return generateChildPath(selectedParent.value, title.value)
})

function extractParentPath(fullPath: string): string {
  if (!fullPath) return ''
  const parts = fullPath.split('.')
  if (parts.length <= 1) return ''
  return parts.slice(0, -1).join('.')
}

// ── Cover image handling ────────────────────────────────────────
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

// ── Raw mode toggle ─────────────────────────────────────────────
function toggleRawMode() {
  if (!isRawMode.value) {
    // Switching TO raw mode: capture current markdown, destroy editor
    rawMarkdown.value = currentMarkdown.value
    if (editor.value) {
      editor.value.destroy()
      editor.value = null
    }
    isRawMode.value = true
  } else {
    // Switching FROM raw mode: recreate editor with raw markdown
    isRawMode.value = false
    nextTick(() => {
      initEditor(rawMarkdown.value)
    })
  }
}

// ── Save ────────────────────────────────────────────────────────
function handleSave() {
  titleError.value = ''
  if (!title.value.trim()) {
    titleError.value = 'Title is required.'
    return
  }
  const content = isRawMode.value ? rawMarkdown.value : currentMarkdown.value
  emit('save', {
    title: title.value,
    content,
    path: generatedPath.value || '',
    coverImageUrl: coverImageUrl.value || undefined,
    entityType: entityType.value as string,
  })
}
</script>
<style scoped>
.gm-wiki-editor { display: flex; flex-direction: column; gap: 16px; }
.editor-field { display: flex; flex-direction: column; gap: 4px; }
.editor-field label { font-size: 0.8rem; color: #a0a0b0; text-transform: uppercase; letter-spacing: 1px; }
.editor-field input, .editor-field select { padding: 8px 12px; background: #1a1a2e; border: 1px solid #0f3460; border-radius: 6px; color: #e0e0e0; font-size: 0.95rem; }
.editor-field input:focus, .editor-field select:focus { outline: none; border-color: #e94560; }
.input-error { border-color: #c62828 !important; }
.field-error { color: #c62828; font-size: 0.8rem; margin-top: 2px; }
.path-preview { padding: 6px 12px; background: #0f3460; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #e94560; }
.cover-dropzone { position: relative; border: 2px dashed #0f3460; border-radius: 6px; padding: 8px; transition: border-color 0.2s; }
.cover-dropzone.drop-active { border-color: #e94560; background: rgba(233, 69, 96, 0.06); }
.cover-file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.cover-image-input { width: 100%; border: none !important; background: transparent !important; padding: 4px 0 !important; }
.cover-uploading { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: #e94560; }
.cover-preview { margin-top: 8px; max-width: 200px; max-height: 120px; border-radius: 6px; border: 1px solid #0f3460; object-fit: cover; }
.save-button { padding: 10px 20px; background: #e94560; color: #fff; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; transition: background 0.2s; align-self: flex-start; }
.save-button:hover { background: #f75973; }
.raw-mode-toggle { padding: 8px 16px; background: #0f3460; color: #e0e0e0; border: 1px solid #e94560; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
.raw-mode-toggle:hover { background: #1a3a70; }
.raw-markdown-textarea { width: 100%; min-height: 400px; padding: 16px; background: #1a1a2e; border: 1px solid #0f3460; border-radius: 6px; color: #e0e0e0; font-family: 'Courier New', monospace; font-size: 0.95rem; line-height: 1.6; resize: vertical; }
.raw-markdown-textarea:focus { outline: none; border-color: #e94560; }
.tiptap-content { padding: 16px; background: #1a1a2e; border: 1px solid #0f3460; border-radius: 6px; min-height: 400px; color: #e0e0e0; font-size: 0.95rem; line-height: 1.6; }
.editor-wrapper { position: relative; }
.autocomplete-overlay { position: fixed; inset: 0; z-index: 9998; display: flex; align-items: center; justify-content: center; }
.autocomplete-backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 0; }
.autocomplete-picklist { position: relative; z-index: 1; width: 500px; max-width: 90vw; max-height: 50vh; overflow-y: auto; background: #1a1a2e; border: 1px solid #e94560; border-radius: 8px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); }
.autocomplete-search-input { width: 100%; padding: 10px 12px; background: transparent; border: none; border-bottom: 1px solid #0f3460; color: #e0e0e0; font-size: 0.85rem; outline: none; }
.autocomplete-search-input::placeholder { color: #555; }
.autocomplete-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; cursor: pointer; transition: background 0.15s; }
.autocomplete-item:hover { background: rgba(233, 69, 96, 0.15); }
.autocomplete-title { color: #e0e0e0; font-size: 0.85rem; font-weight: 600; }
.autocomplete-type { color: #e94560; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; }
.autocomplete-empty { padding: 12px; text-align: center; color: #666; font-size: 0.8rem; }
</style>
