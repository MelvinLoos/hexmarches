<template>
  <Teleport to="body">
    <div
      v-if="visible && editor"
      ref="bubbleEl"
      class="fixed z-50 flex gap-0.5 rounded-lg bg-gm-bg border border-gm-border shadow-xl p-1"
      data-testid="bubble-menu"
      :style="bubbleStyle"
    >
      <button
        class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
        :class="{ 'bg-gm-primary text-white': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
        :class="{ 'bg-gm-primary text-white': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
        :class="{ 'bg-gm-primary text-white': editor.isActive('strike') }"
        @click="editor.chain().focus().toggleStrike().run()"
        title="Strikethrough"
      >
        <del>S</del>
      </button>
      <button
        class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
        data-testid="bubble-link"
        title="Wiki Link"
        @click="linkSelectedText"
      >
        🔗
      </button>
      <span class="w-px bg-gm-border mx-1" />
      <button
        class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-gm-primary text-white': editor.isActive('heading', { level: 2 }) }"
        title="Heading 2"
      >
        H2
      </button>
      <button
        class="px-2 py-1 rounded text-sm hover:bg-gm-border transition-colors"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-gm-primary text-white': editor.isActive('heading', { level: 3 }) }"
        title="Heading 3"
      >
        H3
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import type { Editor } from '@tiptap/core'

const props = defineProps<{
  editor: Editor | null
}>()

const visible = ref(false)
const bubbleEl = ref<HTMLElement | null>(null)
const bubbleStyle = ref({ top: '0px', left: '0px' })

function updatePosition() {
  if (!props.editor) return
  const { from, to } = props.editor.state.selection
  if (from === to) {
    visible.value = false
    return
  }
  const coords = props.editor.view.coordsAtPos(from)
  if (!coords) {
    visible.value = false
    return
  }
  bubbleStyle.value = {
    top: `${coords.top - 40}px`,
    left: `${coords.left}px`,
  }
  visible.value = true
}

/** Text currently highlighted in the editor, trimmed for the link title. */
function getSelectedText(): string {
  const ed = props.editor
  if (!ed) return ''
  const { from, to } = ed.state.selection
  return ed.state.doc.textBetween(from, to).trim()
}

/**
 * Wrap the highlighted text in a wikiLink node by delegating to the
 * WikiLink extension's `setWikiLink` command.
 */
function linkSelectedText() {
  const ed = props.editor
  if (!ed) return
  const title = getSelectedText()
  if (!title) return
  ed.chain().focus().setWikiLink(title).run()
  visible.value = false
}

watch(
  () => props.editor?.state.selection,
  () => {
    updatePosition()
  },
  { deep: true },
)

onMounted(() => {
  if (props.editor) {
    props.editor.on('selectionUpdate', updatePosition)
    props.editor.on('blur', () => { visible.value = false })
  }
})

onBeforeUnmount(() => {
  if (props.editor) {
    props.editor.off('selectionUpdate', updatePosition)
  }
})
</script>