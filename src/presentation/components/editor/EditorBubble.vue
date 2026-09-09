<template>
  <BubbleMenu
    v-if="editor"
    :editor="editor"
    :tippy-options="{ duration: 150, placement: 'top' }"
    class="flex gap-0.5 rounded-lg bg-gm-bg border border-gm-border shadow-xl p-1"
    data-testid="bubble-menu"
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
  </BubbleMenu>
</template>

<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/core'

defineProps<{
  editor: Editor | null
}>()
</script>