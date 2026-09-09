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
    <GmEditorToolbar v-if="!isRawMode && editor" :editor="editor" />
    <div v-if="!isRawMode && editor" :key="editorKey" data-testid="tiptap-editor" class="editor-wrapper tiptap-editor-wrapper" @dragover.prevent @drop.prevent="handleEditorDrop">
      <EditorBubble v-if="editor" :editor="editor" />
      <EditorSlash v-if="editor" :editor="editor" />
      <EditorContent :editor="editor" class="tiptap-content" />
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { useCommandPalette } from '~/composables/useCommandPalette'
import { getEditorExtensions } from '~/src/presentation/tiptap/editor-setup'
import { useAssetUpload } from '~/composables/useAssetUpload'
import EditorBubble from '~/src/presentation/components/editor/EditorBubble.vue'
import EditorSlash from '~/src/presentation/components/editor/EditorSlash.vue'
import GmEditorToolbar from '~/src/presentation/components/editor/GmEditorToolbar.vue'
import type { Editor } from '@tiptap/core'
import type { WikiNode } from '~/src/core/domain/wiki-node'
import { generateChildPath, WikiNodeType } from '~/src/core/domain/wiki-node'

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

// ── Form state ─────────────────────────────────────────────────
const title = ref(props.initialTitle ?? '')
const coverImageUrl = ref(props.initialCoverImageUrl ?? '')
const entityType = ref(props.initialEntityType || WikiNodeType.GENERAL)
const titleError = ref('')
const dragOver = ref(false)
const coverUploading = ref(false)
const selectedParent = ref(extractParentPath(props.initialPath ?? ''))

// ── Raw mode ───────────────────────────────────────────────────
const isRawMode = ref(false)
const rawMarkdown = ref(props.initialContent ?? '')
const currentMarkdown = ref(props.initialContent ?? '')
// Force re-mount of editor-wrapper when toggling back from raw mode
const editorKey = ref(0)

// ── TipTap editor ──────────────────────────────────────────────
// useEditor() creates the Editor in onMounted (after DOM exists)
// and destroys it in onBeforeUnmount. It returns a ShallowRef<Editor>.
const editor = useEditor({
  content: props.initialContent ?? '',
  extensions: getEditorExtensions(),
  onUpdate: ({ editor: ed }) => {
    const md = (ed as any).storage?.markdown?.getMarkdown?.() ?? ''
    currentMarkdown.value = md
  },
})

// ── Editor command palette trigger ─────────────────────────────
const commandPalette = useCommandPalette()

onMounted(() => {
  // Key binding runs once editor is mounted
  const ed = editor.value
  if (ed) {
    ed.on('keydown', ({ event }: { event: KeyboardEvent }) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'K') {
        event.preventDefault()
        commandPalette.open()
      }
    })
  }
})

// ── Folder / Path logic ────────────────────────────────────────
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

// ── Cover image handling ───────────────────────────────────────
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

// ── Editor drag/drop asset upload ──────────────────────────────
const { uploadAsset: uploadEditorAsset, uploading: editorUploading } = useAssetUpload()

async function handleEditorDrop(event: DragEvent) {
  if (!editor.value) return
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.startsWith('image/')) continue
    try {
      const url = await uploadEditorAsset(file)
      if (url) {
        editor.value.commands.setImage({ src: url, alt: file.name })
      }
    } catch {
      // Error handled by useAssetUpload state
    }
  }
}

// ── Raw mode toggle ────────────────────────────────────────────
function toggleRawMode() {
  if (!isRawMode.value) {
    rawMarkdown.value = currentMarkdown.value
    isRawMode.value = true
  } else {
    isRawMode.value = false
    // Force editor re-creation when returning from raw mode
    // useEditor will reconstruct on next render tick with fresh content
    editorKey.value++
    nextTick(() => {
      // Inject raw markdown into the newly created editor
      if (editor.value) {
        editor.value.commands.setContent(rawMarkdown.value)
      }
    })
  }
}

// ── Save ───────────────────────────────────────────────────────
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
.tiptap-content { padding: 16px; background: #1a1a2e; border: 1px solid #0f3460; border-radius: 6px; min-height: 400px; color: #e0e0e0; font-size: 0.95rem; line-height: 1.6; box-sizing: border-box; }
/* Make the actual ProseMirror contenteditable fill the whole box instead of
   shrinking to a single line of text. */
.tiptap-content :deep(.ProseMirror) {
  min-height: calc(400px - 32px); /* 400px box minus 16px top/bottom padding */
  outline: none;
  box-sizing: border-box;
}
.tiptap-content :deep(p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: #6b7280;
  float: left;
  height: 0;
  pointer-events: none;
}
.editor-wrapper { position: relative; width: 100%; }
</style>
