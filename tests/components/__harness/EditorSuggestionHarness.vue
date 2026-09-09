<template>
  <div class="editor-suggestion-harness">
    <EditorContent v-if="editor" :editor="editor" class="tiptap-content" />
    <EditorSlash v-if="editor" :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { getEditorExtensions } from '~/src/presentation/tiptap/editor-setup'
import EditorSlash from '~/src/presentation/components/editor/EditorSlash.vue'

// Test harness: creates the REAL TipTap editor with the REAL production
// extension set (StarterKit, Markdown, Image, WikiLink, GmSecret) and hands
// the live editor instance to the test via the onEditor prop.
const props = defineProps<{
  onEditor?: (editor: any) => void
  initialContent?: string
}>()

const editor = useEditor({
  content: props.initialContent ?? '',
  extensions: getEditorExtensions(),
  onUpdate: () => {},
})

watch(editor, () => {
  if (editor.value) props.onEditor?.(editor.value)
})
</script>