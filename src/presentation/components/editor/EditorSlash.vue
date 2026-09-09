<template>
  <Teleport to="body">
    <div
      v-if="visible && editor"
      class="fixed z-50 flex flex-col rounded-lg bg-gm-bg border border-gm-border shadow-xl overflow-hidden w-56"
      data-testid="slash-menu"
      :style="menuStyle"
    >
      <div class="px-3 py-2 text-xs text-gm-muted uppercase tracking-wider border-b border-gm-border">
        Slash Commands
      </div>
      <div class="max-h-60 overflow-y-auto">
        <button
          v-for="item in filteredItems"
          :key="item.id"
          class="flex items-center gap-2 px-3 py-2 text-sm text-gm-text hover:bg-gm-border transition-colors text-left w-full"
          data-testid="slash-item"
          @click="selectItem(item)"
        >
          <span class="text-gm-primary w-5">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
        <div
          v-if="filteredItems.length === 0"
          class="px-3 py-4 text-sm text-gm-muted text-center"
        >
          No matching commands
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Editor } from '@tiptap/core'

const props = defineProps<{
  editor: Editor | null
}>()

interface SlashItem {
  id: string
  label: string
  icon: string
  filter: string
  action: (editor: Editor) => void
}

const visible = ref(false)
const query = ref('')
const menuStyle = ref({ top: '0px', left: '0px' })

const items: SlashItem[] = [
  { id: 'h1', label: 'Heading 1', icon: 'H1', filter: 'heading h1', action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', icon: 'H2', filter: 'heading h2', action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', icon: 'H3', filter: 'heading h3', action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bold', label: 'Bold Text', icon: 'B', filter: 'bold', action: (ed) => ed.chain().focus().toggleBold().run() },
  { id: 'italic', label: 'Italic Text', icon: 'I', filter: 'italic', action: (ed) => ed.chain().focus().toggleItalic().run() },
  { id: 'bullet', label: 'Bullet List', icon: '•', filter: 'bullet list', action: (ed) => ed.chain().focus().toggleBulletList().run() },
  { id: 'ordered', label: 'Ordered List', icon: '1.', filter: 'ordered numbered list', action: (ed) => ed.chain().focus().toggleOrderedList().run() },
  { id: 'quote', label: 'Blockquote', icon: '\"', filter: 'quote blockquote', action: (ed) => ed.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Code Block', icon: '<>', filter: 'code', action: (ed) => ed.chain().focus().toggleCodeBlock().run() },
  { id: 'wikilink', label: 'Link Page', icon: '🔗', filter: 'link page wiki wikilink', action: (ed) => { ed.commands.triggerWikiLinkSearch?.() } },
  { id: 'gmsecret', label: 'GM Secret', icon: '🔒', filter: 'gm secret sec', action: (ed) => { ed.commands.insertGmSecret?.('GM Note') } },
]

const filteredItems = computed(() => {
  if (!query.value) return items
  const q = query.value.toLowerCase()
  return items.filter((item) => item.filter.toLowerCase().includes(q))
})

function selectItem(item: SlashItem) {
  visible.value = false
  query.value = ''
  if (props.editor) {
    item.action(props.editor)
  }
}

function showAt(pos: { top: number; left: number }, initialQuery = '') {
  menuStyle.value = { top: `${pos.top}px`, left: `${pos.left}px` }
  query.value = initialQuery
  visible.value = true
}

function hide() {
  visible.value = false
  query.value = ''
}

// ── Keyboard trigger ─────────────────────────────────────────────
// Pressing "/" on the editor opens the menu at the cursor; while open,
// printable characters extend the filter query, Enter selects the first
// match, Escape dismisses, and Backspace edits the query.
function handleEditorKeydown({ event }: { event: KeyboardEvent }) {
  const editor = props.editor
  if (!editor) return

  if (!visible.value) {
    if (event.key === '/') {
      event.preventDefault()
      openAtCursor(editor)
    }
    return
  }

  switch (event.key) {
    case 'Escape':
      hide()
      break
    case 'Enter':
      event.preventDefault()
      const first = filteredItems.value[0]
      if (first) selectItem(first)
      break
    case 'Backspace':
      event.preventDefault()
      query.value = query.value.slice(0, -1)
      break
    default:
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        query.value += event.key
      }
  }
}

function openAtCursor(editor: Editor) {
  const coords = editor.view.coordsAtPos(editor.state.selection.from)
  if (!coords) return
  showAt({ top: coords.top + 24, left: coords.left })
}

onMounted(() => {
  props.editor?.on('keydown', handleEditorKeydown)
})

onBeforeUnmount(() => {
  props.editor?.off('keydown', handleEditorKeydown)
})

defineExpose({ showAt, hide, visible, query })
</script>